// Default values for a tune: toggles off, enums on their first option, numbers unset.

import { FIELDS } from './schema'
import type { Tune } from './types'

export function defaultTune(): Tune {
  const tune: Record<string, unknown> = {}
  for (const field of FIELDS) {
    if (field.kind === 'toggle') tune[field.key] = false
    else if (field.kind === 'enum') tune[field.key] = field.options[0]
  }
  return tune as Tune
}

// Fills anything the partial tune lacks with its default, which is what a parsed link needs.
export function withDefaults(partial: Tune): Tune {
  return { ...defaultTune(), ...partial }
}
