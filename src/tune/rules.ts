// Rules for a tune: which fields are enabled, and how values are clamped and cleaned.
// With no car chosen (drivetrain undefined) every drivetrain rule leaves the field enabled.

import { FIELDS } from './schema'
import type { FieldDef } from './schema'
import type { Drivetrain, FieldKey, GearSet, Tune } from './types'

interface Ctx {
  tune: Tune
  drivetrain?: Drivetrain
}

const frontDriven = ({ drivetrain }: Ctx) =>
  drivetrain === undefined || drivetrain === 'FF' || drivetrain === '4WD' || drivetrain === 'Other'
const rearDriven = ({ drivetrain }: Ctx) => drivetrain !== 'FF'
const fourWheelDrive = ({ drivetrain }: Ctx) => drivetrain === undefined || drivetrain === '4WD'
const fullySprung = ({ tune }: Ctx) => tune.suspension === 'Fully Customised Suspension'

// Only fields with a condition are listed; everything else is always enabled.
const ENABLED_WHEN: Partial<Record<FieldKey, (ctx: Ctx) => boolean>> = {
  diffFrontInitialTorque: frontDriven,
  diffFrontAccelSensitivity: frontDriven,
  diffFrontBrakingSensitivity: frontDriven,
  diffRearInitialTorque: rearDriven,
  diffRearAccelSensitivity: rearDriven,
  diffRearBrakingSensitivity: rearDriven,
  centerDifferential: fourWheelDrive,
  torqueSplitFront: fourWheelDrive,
  // A missing enum means its default, which is the first option.
  antiLagSystem: ({ tune }) => (tune.antiLag ?? 'None') !== 'None',
  handbrakeTorque: ({ tune }) => (tune.handbrake ?? 'Normal') !== 'Normal',
  suspFrontBodyHeight: fullySprung,
  suspFrontAntiRollBar: fullySprung,
  suspFrontDampingCompression: fullySprung,
  suspFrontDampingExpansion: fullySprung,
  suspFrontNaturalFrequency: fullySprung,
  suspFrontNegativeCamber: fullySprung,
  suspFrontToe: fullySprung,
  suspRearBodyHeight: fullySprung,
  suspRearAntiRollBar: fullySprung,
  suspRearDampingCompression: fullySprung,
  suspRearDampingExpansion: fullySprung,
  suspRearNaturalFrequency: fullySprung,
  suspRearNegativeCamber: fullySprung,
  suspRearToe: fullySprung,
}

export function isEnabled(key: FieldKey, tune: Tune, drivetrain?: Drivetrain): boolean {
  return ENABLED_WHEN[key]?.({ tune, drivetrain }) ?? true
}

// Rounds to the given number of decimals and applies min and max. Returns undefined for NaN or Infinity.
function clampNumber(value: number, decimals: number, min?: number, max?: number): number | undefined {
  if (!Number.isFinite(value)) return undefined
  let n = Number(value.toFixed(decimals))
  if (min !== undefined) n = Math.max(min, n)
  if (max !== undefined) n = Math.min(max, n)
  return n
}

// Cleans one value for its field, or returns undefined when it cannot be made valid.
export function clampValue(field: FieldDef, value: unknown): unknown {
  switch (field.kind) {
    case 'toggle':
      return typeof value === 'boolean' ? value : undefined
    case 'enum':
      return typeof value === 'string' && field.options.includes(value) ? value : undefined
    case 'int':
      return typeof value === 'number' ? clampNumber(value, 0, field.min, field.max) : undefined
    case 'decimal':
      return typeof value === 'number' ? clampNumber(value, field.decimals, field.min, field.max) : undefined
    case 'ratio':
      return typeof value === 'number' ? clampNumber(value, 0, field.min, field.max) : undefined
    case 'gears':
      return clampGears(field, value)
  }
}

function clampGears(field: Extract<FieldDef, { kind: 'gears' }>, value: unknown): GearSet | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const raw = value as Partial<GearSet>
  const gears = (Array.isArray(raw.gears) ? raw.gears : [])
    .slice(0, field.maxGears)
    .map((g) => (typeof g === 'number' ? clampNumber(g, field.decimals, 0) : undefined))
  // A gap in the list would shift every later gear, so stop at the first unusable one.
  const firstBad = gears.indexOf(undefined)
  const valid = (firstBad === -1 ? gears : gears.slice(0, firstBad)) as number[]
  const final = typeof raw.final === 'number' ? clampNumber(raw.final, field.decimals, 0) : undefined
  if (valid.length === 0 && final === undefined) return undefined
  return final === undefined ? { gears: valid } : { gears: valid, final }
}

// Returns a cleaned copy of the tune.
// 1. Drop unknown keys and values that cannot be made valid.
// 2. Clamp numbers to their range and decimals.
// 3. Drop values for fields the rules currently disable.
export function normaliseTune(tune: Tune, drivetrain?: Drivetrain): Tune {
  const cleaned: Record<string, unknown> = {}
  for (const field of FIELDS) {
    const value = clampValue(field, (tune as Record<string, unknown>)[field.key])
    if (value !== undefined) cleaned[field.key] = value
  }
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(cleaned)) {
    if (isEnabled(key as FieldKey, cleaned as Tune, drivetrain)) result[key] = cleaned[key]
  }
  return result as Tune
}
