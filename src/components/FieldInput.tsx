import { useId } from 'react'
import { isEnabled } from '../tune/rules'
import type { FieldDef } from '../tune/schema'
import type { Drivetrain, FieldKey, Tune } from '../tune/types'
import { NumberInput } from './NumberInput'

export type ChangeHandler = (key: FieldKey, value: unknown) => void

interface Props {
  field: FieldDef
  tune: Tune
  drivetrain?: Drivetrain
  onChange: ChangeHandler
}

// One labelled control for a schema field, chosen by the field's kind and greyed out by the rules.
//
// The tune is read through a loose Record because the schema's keys are only known as a union
// type here; the value's real type is guaranteed by `field.kind`, which we switch on.
// Torque split ('ratio') and gear lists ('gears') render nothing until issue #13 adds them.
export function FieldInput({ field, tune, drivetrain, onChange }: Props) {
  const id = useId()
  const key = field.key as FieldKey
  const value = (tune as Record<string, unknown>)[field.key]
  const enabled = isEnabled(key, tune, drivetrain)

  switch (field.kind) {
    case 'toggle':
      return (
        <div className="field field-toggle" data-disabled={!enabled}>
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            disabled={!enabled}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <label htmlFor={id}>{field.label}</label>
        </div>
      )

    case 'enum':
      return (
        <div className="field" data-disabled={!enabled}>
          <label htmlFor={id}>{field.label}</label>
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
    case 'decimal':
      return (
        <div className="field" data-disabled={!enabled}>
          <label htmlFor={id}>{field.label}</label>
          <NumberInput
            id={id}
            field={field}
            value={typeof value === 'number' ? value : undefined}
            disabled={!enabled}
            onChange={(v) => onChange(key, v)}
          />
        </div>
      )

    case 'ratio':
    case 'gears':
      return null
  }
}
