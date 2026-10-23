import { useId } from 'react'
import { isEnabled } from '../tune/rules'
import type { FieldDef } from '../tune/schema'
import type { Drivetrain, FieldKey, Tune } from '../tune/types'
import { convertField, isUnitField } from '../tune/units'
import type { Units } from '../tune/units'
import { NumberInput } from './NumberInput'

export type ChangeHandler = (key: FieldKey, value: unknown) => void

interface Props {
  field: FieldDef
  tune: Tune
  drivetrain?: Drivetrain
  onChange: ChangeHandler
  // A paired Front/Rear cell: the row shows the label once, so this one is hidden from sight but
  // stays in the page for screen readers and for tests that look fields up by label.
  bare?: boolean
  // The unit the tune's numbers are kept in, and the one shown. A number with a unit family is
  // converted between them for display (#14). Without it, numbers show as they are.
  units?: { stored: Units; shown: Units }
}

// One labelled control for a schema field, chosen by the field's kind and greyed out by the rules.
//
// The tune is read through a loose Record because the schema's keys are only known as a union
// type here; the value's real type is guaranteed by `field.kind`, which we switch on.
// Torque split ('ratio') and gear lists ('gears') render nothing until issue #13 adds them.
export function FieldInput({ field, tune, drivetrain, onChange, bare, units }: Props) {
  const id = useId()
  const labelClass = bare ? 'sr-only' : undefined
  const key = field.key as FieldKey
  const value = (tune as Record<string, unknown>)[field.key]
  const enabled = isEnabled(key, tune, drivetrain)

  switch (field.kind) {
    case 'toggle':
      return (
        // The whole row is the label, so a click anywhere on it flips the checkbox.
        <label className="field field-toggle" htmlFor={id} data-disabled={!enabled}>
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            disabled={!enabled}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <span className={labelClass}>{field.label}</span>
        </label>
      )

    case 'enum':
      return (
        <div className="field" data-disabled={!enabled}>
          <label htmlFor={id} className={labelClass}>{field.label}</label>
          {/* A missing enum means its default, which is the first option (see defaults.ts). */}
          <select
            id={id}
            value={typeof value === 'string' ? value : field.options[0]}
            disabled={!enabled}
            onChange={(e) => onChange(key, e.target.value)}
          >
            {field.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )

    case 'int':
    case 'decimal': {
      // The stored number moved into the shown unit. What the user types is already in that unit.
      const shown =
        typeof value === 'number' ? (isUnitField(field) && units ? convertField(field, value, units.stored, units.shown) : value) : undefined
      return (
        <div className="field" data-disabled={!enabled}>
          <label htmlFor={id} className={labelClass}>{field.label}</label>
          <NumberInput
            id={id}
            field={field}
            value={shown}
            disabled={!enabled}
            onChange={(v) => onChange(key, v)}
          />
        </div>
      )
    }

    case 'ratio':
    case 'gears':
      return null
  }
}
