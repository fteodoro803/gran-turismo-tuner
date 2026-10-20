// Types derived from the schema: Drivetrain, FieldKey and the Tune shape.

import type { DRIVETRAINS, SECTIONS } from './schema'

export type Drivetrain = (typeof DRIVETRAINS)[number]

export type PowerUnit = 'HP' | 'BHP' | 'PS'
export type WeightUnit = 'kg' | 'lbs'
export type TorqueUnit = 'ft-lb' | 'Nm'

// Gears 1st..Nth in order, plus the Final gear shown separately.
export interface GearSet {
  gears: number[]
  final?: number
}

type Field = (typeof SECTIONS)[number]['fields'][number]

export type FieldKey = Field['key']

type ValueOf<F> = F extends { kind: 'toggle' }
  ? boolean
  : F extends { kind: 'enum'; options: infer O extends readonly string[] }
    ? O[number]
    : F extends { kind: 'gears' }
      ? GearSet
      : F extends { kind: 'int' | 'decimal' | 'ratio' }
        ? number
        : never

// Every field is optional: a missing toggle or enum means "default", a missing number means "not set".
export type Tune = { [F in Field as F['key']]?: ValueOf<F> }
