// The share-link codec: turns a car and a tune into the text after the `#`, and back (#5).
//
// Link format (D2), plain text with no JSON and no base64, parts separated by commas:
//   <version>,<car id>,<toggles>,<n>:<value>,<n>:<value>,...
// - Version 2 adds `u:<power><torque><weight>`, the position of the unit each number was typed in
//   (#14). It is left out when all three are the defaults. Version 1 links have no units and open
//   with the defaults.
// - Each field is named by its permanent number `n` from the schema, so renaming or reordering
//   a field never changes what an old link means.
// - Toggles that are on share one number: bit (n - 1) is set for each, written in base 36.
// - Everything else is left out at its default. An enum is the position of its option in the
//   schema (so options are append-only), a number is itself, and gears are `g1/g2/g3~final`.

import { CARS } from '../data/cars'
import type { Car } from '../components/CarPicker'
import { withDefaults } from './defaults'
import { normaliseTune } from './rules'
import { FIELDS } from './schema'
import type { FieldDef } from './schema'
import type { GearSet, Tune } from './types'
import { DEFAULT_UNITS, packUnits, parseUnits } from './units'
import type { Units } from './units'

export interface LinkContents {
  tune: Tune
  car: Car
  units: Units
}

// Bumped when the format changes in a way old decoders can't read. Older versions still open.
const VERSION = 2
const READABLE_VERSIONS = ['1', '2']
const UNITS_KEY = 'u'

const FIELD_BY_N = new Map<number, FieldDef>(FIELDS.map((f) => [f.n, f]))
const CAR_BY_ID = new Map<number, Car>(CARS.map((c) => [c.id, c]))

const NUMBER = /^-?\d+(\.\d+)?$/
const WHOLE = /^\d+$/

// ===== toggles, packed into one number =====

const bit = (field: FieldDef) => 1n << BigInt(field.n - 1)

function parseBase36(text: string): bigint | undefined {
  if (!/^[0-9a-z]+$/.test(text)) return undefined
  let value = 0n
  for (const ch of text) value = value * 36n + BigInt(parseInt(ch, 36))
  return value
}

// ===== one field's value <-> its text =====

// The text for a value, or undefined when it equals the default and can be left out.
function packValue(field: FieldDef, value: unknown): string | undefined {
  switch (field.kind) {
    case 'toggle':
      return undefined
    case 'enum': {
      const position = field.options.indexOf(value as string)
      return position > 0 ? String(position) : undefined
    }
    case 'gears': {
      const { gears, final } = value as GearSet
      return final === undefined ? gears.join('/') : `${gears.join('/')}~${final}`
    }
    default:
      return String(value)
  }
}

// The real value for a piece of text, or undefined when it can't be read. Numbers are passed
// through as they are, since normaliseTune clamps them afterwards.
function unpackValue(field: FieldDef, text: string): unknown {
  switch (field.kind) {
    case 'toggle':
      return undefined
    case 'enum':
      return WHOLE.test(text) ? field.options[Number(text)] : undefined
    case 'gears': {
      const [list, final, ...extra] = text.split('~')
      const gears = list === '' ? [] : list.split('/')
      const numbers = [...gears, ...(final === undefined ? [] : [final])]
      if (extra.length > 0 || !numbers.every((s) => NUMBER.test(s))) return undefined
      return final === undefined ? { gears: gears.map(Number) } : { gears: gears.map(Number), final: Number(final) }
    }
    default:
      return NUMBER.test(text) ? Number(text) : undefined
  }
}

// ===== encode and decode =====

// The text for after the `#`: the car and the tune with everything left at its default dropped.
//
// 1. Clean the tune for the car's drivetrain, so a value for a locked field is not shared (D6).
// 2. Set one bit for each toggle that is on.
// 3. Write each other field that is set and not at its default as `n:value`.
// 4. Write the units the numbers were typed in, unless they are all the defaults.
export function encode({ tune, car, units = DEFAULT_UNITS }: Omit<LinkContents, 'units'> & { units?: Units }): string {
  const cleaned = normaliseTune(tune, car.drivetrain) as Record<string, unknown>
  let toggles = 0n
  const pairs: string[] = []
  for (const field of FIELDS) {
    const value = cleaned[field.key]
    if (value === undefined) continue
    if (field.kind === 'toggle') {
      if (value === true) toggles |= bit(field)
      continue
    }
    const text = packValue(field, value)
    if (text !== undefined) pairs.push(`${field.n}:${text}`)
  }
  const unitsText = packUnits(units)
  if (unitsText !== undefined) pairs.push(`${UNITS_KEY}:${unitsText}`)
  return [VERSION, car.id, toggles.toString(36), ...pairs].join(',')
}

// The car and tune a link holds, or undefined when the link cannot be read.
//
// Unreadable means: the start isn't `version,car,toggles`, a version this code doesn't know, or a
// car that isn't in the list. Anything wrong inside a single field is dropped quietly and the
// rest still opens.
export function decode(text: string): LinkContents | undefined {
  const [version, carId, togglesText, ...pairs] = text.split(',')
  if (!READABLE_VERSIONS.includes(version) || !WHOLE.test(carId ?? '')) return undefined
  const car = CAR_BY_ID.get(Number(carId))
  const toggles = parseBase36(togglesText ?? '')
  if (!car || toggles === undefined) return undefined

  const raw: Record<string, unknown> = {}
  for (const field of FIELDS) {
    if (field.kind === 'toggle' && (toggles & bit(field)) !== 0n) raw[field.key] = true
  }
  let units = DEFAULT_UNITS
  for (const pair of pairs) {
    const colon = pair.indexOf(':')
    if (colon === -1) continue
    if (pair.slice(0, colon) === UNITS_KEY) {
      units = parseUnits(pair.slice(colon + 1))
      continue
    }
    const field = FIELD_BY_N.get(Number(pair.slice(0, colon)))
    const value = field && unpackValue(field, pair.slice(colon + 1))
    if (field && value !== undefined) raw[field.key] = value
  }
  return { tune: withDefaults(normaliseTune(raw as Tune, car.drivetrain)), car, units }
}
