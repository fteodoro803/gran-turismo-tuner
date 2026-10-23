// The share-link codec: turns a car and a tune into the text after the `#`, and back (#5).
//
// Link format (D2), before base64url: {"v":1,"c":<car id>,"t":{"<field n>":<value>, ...}}
// - Fields are keyed by their permanent number `n` from the schema, so renaming or reordering a
//   field never changes what an old link means.
// - Defaults are left out: a toggle is present as 1 when on, an enum as the position of its option
//   in the schema (so options are append-only), a number as itself, gears as [[g1, g2, ...], final].

import { CARS } from '../data/cars'
import type { Car } from '../components/CarPicker'
import { withDefaults } from './defaults'
import { normaliseTune } from './rules'
import { FIELDS } from './schema'
import type { FieldDef } from './schema'
import type { GearSet, Tune } from './types'

export interface LinkContents {
  tune: Tune
  car: Car
}

// Bumped when the format changes in a way old decoders can't read.
const VERSION = 1

const FIELD_BY_N = new Map<number, FieldDef>(FIELDS.map((f) => [f.n, f]))
const CAR_BY_ID = new Map<number, Car>(CARS.map((c) => [c.id, c]))

// ===== base64url over UTF-8 text =====

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

// ===== one field's value <-> its compact form =====

// The compact form of a value, or undefined when it equals the default and can be left out.
function packValue(field: FieldDef, value: unknown): unknown {
  switch (field.kind) {
    case 'toggle':
      return value === true ? 1 : undefined
    case 'enum': {
      const position = field.options.indexOf(value as string)
      return position > 0 ? position : undefined
    }
    case 'gears': {
      const { gears, final } = value as GearSet
      return final === undefined ? [gears] : [gears, final]
    }
    default:
      return value
  }
}

// The real value for a compact one, or undefined when it can't be read. Numbers are passed
// through as they are, since normaliseTune clamps them afterwards.
function unpackValue(field: FieldDef, packed: unknown): unknown {
  switch (field.kind) {
    case 'toggle':
      return packed === 1 ? true : undefined
    case 'enum':
      return Number.isInteger(packed) ? field.options[packed as number] : undefined
    case 'gears': {
      if (!Array.isArray(packed) || !Array.isArray(packed[0])) return undefined
      return packed[1] === undefined ? { gears: packed[0] } : { gears: packed[0], final: packed[1] }
    }
    default:
      return packed
  }
}

// ===== encode and decode =====

// The text for after the `#`: the car and the tune with everything left at its default dropped.
//
// 1. Clean the tune for the car's drivetrain, so a value for a locked field is not shared (D6).
// 2. Pack each field that is set and not at its default, keyed by its number.
// 3. Write the JSON as UTF-8 and encode it as base64url.
export function encode({ tune, car }: LinkContents): string {
  const cleaned = normaliseTune(tune, car.drivetrain) as Record<string, unknown>
  const packed: Record<number, unknown> = {}
  for (const field of FIELDS) {
    const value = cleaned[field.key]
    if (value === undefined) continue
    const compact = packValue(field, value)
    if (compact !== undefined) packed[field.n] = compact
  }
  return toBase64Url(JSON.stringify({ v: VERSION, c: car.id, t: packed }))
}

// The car and tune a link holds, or undefined when the link cannot be read.
//
// Unreadable means: not base64url or JSON, a version this code doesn't know, or a car that isn't
// in the list. Anything wrong inside a single field is dropped quietly and the rest still opens.
export function decode(text: string): LinkContents | undefined {
  try {
    const data: unknown = JSON.parse(fromBase64Url(text))
    if (typeof data !== 'object' || data === null) return undefined
    const { v, c, t } = data as { v?: unknown; c?: unknown; t?: unknown }
    if (v !== VERSION) return undefined
    const car = typeof c === 'number' ? CAR_BY_ID.get(c) : undefined
    if (!car) return undefined

    const raw: Record<string, unknown> = {}
    if (typeof t === 'object' && t !== null) {
      for (const [n, packed] of Object.entries(t)) {
        const field = FIELD_BY_N.get(Number(n))
        const value = field && unpackValue(field, packed)
        if (field && value !== undefined) raw[field.key] = value
      }
    }
    return { tune: withDefaults(normaliseTune(raw as Tune, car.drivetrain)), car }
  } catch {
    return undefined
  }
}
