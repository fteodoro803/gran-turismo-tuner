// Units and conversion for the fields that have a `unit` family in the schema (#14, D3).
//
// A tune keeps each number in the unit it was typed in, and only the display converts, so a shared
// link never drifts through rounding. Option order is permanent: a link stores a unit's position.

import { FIELDS } from './schema'
import type { FieldDef, UnitFamily } from './schema'
import type { PowerUnit, TorqueUnit, WeightUnit } from './types'

export type Units = { power: PowerUnit; torque: TorqueUnit; weight: WeightUnit }

// The first option of each family is the default, and the order is part of the link format (D17).
export const UNIT_OPTIONS = {
  power: ['HP', 'BHP', 'PS'],
  torque: ['ft-lb', 'Nm'],
  weight: ['kg', 'lbs'],
} as const satisfies Record<UnitFamily, readonly string[]>

export const UNIT_FAMILIES = ['power', 'torque', 'weight'] as const satisfies readonly UnitFamily[]

export const DEFAULT_UNITS: Units = { power: 'HP', torque: 'ft-lb', weight: 'kg' }

// How many watts, newton metres or kilograms one of each unit is. Every conversion goes through
// these, so a new unit is one line and no pair is written by hand. BHP is the same size as HP.
const FACTORS: Record<UnitFamily, Record<string, number>> = {
  power: { HP: 745.699872, BHP: 745.699872, PS: 735.49875 },
  torque: { 'ft-lb': 1.3558179483, Nm: 1 },
  weight: { kg: 1, lbs: 0.45359237 },
}

// A number moved from one unit to another, rounded to the nearest step of `decimals` (#9 still
// to confirm what the game does, so this is the provisional rule).
export function convert(family: UnitFamily, value: number, from: string, to: string, decimals: number): number {
  if (from === to) return value
  const converted = (value * FACTORS[family][from]) / FACTORS[family][to]
  return Number(converted.toFixed(decimals))
}

// The decimals a number field keeps, which is what its converted value is rounded to.
const decimalsOf = (field: FieldDef) => (field.kind === 'decimal' ? field.decimals : 0)

type UnitField = FieldDef & { kind: 'int' | 'decimal'; unit: UnitFamily }

export const isUnitField = (field: FieldDef): field is UnitField =>
  (field.kind === 'int' || field.kind === 'decimal') && field.unit !== undefined

// Every field measured in one family, so a change of stored unit can move them all together.
export const fieldsInFamily = (family: UnitFamily): UnitField[] =>
  FIELDS.filter(isUnitField).filter((f) => f.unit === family)

// The family a field belongs to, or undefined for a field with no unit.
export const familyOf = (key: string): UnitFamily | undefined => {
  const field = FIELDS.find((f) => f.key === key)
  return field && isUnitField(field) ? field.unit : undefined
}

// One field's number moved between the units of its family.
export function convertField(field: UnitField, value: number, from: Units, to: Units): number {
  return convert(field.unit, value, from[field.unit], to[field.unit], decimalsOf(field))
}

// The units from text of one position per family (power, torque, weight), or the defaults for
// any part that can't be read.
export function parseUnits(text: string): Units {
  const pick = <F extends UnitFamily>(family: F, i: number): Units[F] => {
    const options = UNIT_OPTIONS[family] as readonly string[]
    return (/^\d$/.test(text[i] ?? '') && options[Number(text[i])] ? options[Number(text[i])] : DEFAULT_UNITS[family]) as Units[F]
  }
  return { power: pick('power', 0), torque: pick('torque', 1), weight: pick('weight', 2) }
}

// The text for a set of units, or undefined when all are the defaults and can be left out.
export function packUnits(units: Units): string | undefined {
  const text = UNIT_FAMILIES.map((f) => (UNIT_OPTIONS[f] as readonly string[]).indexOf(units[f])).join('')
  return text === '000' ? undefined : text
}

// The unit choice saved in this browser, for a viewer who has picked one before (3A).
const STORAGE_KEY = 'gt-tuner-units'

export function loadSavedUnits(): Partial<Units> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const result: Partial<Units> = {}
    for (const f of UNIT_FAMILIES) {
      if ((UNIT_OPTIONS[f] as readonly unknown[]).includes(saved[f])) (result as Record<string, unknown>)[f] = saved[f]
    }
    return result
  } catch {
    return {}
  }
}

export function saveUnits(units: Units) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units))
  } catch {
    // Storage can be blocked, and the choice then only lasts until the page is closed.
  }
}
