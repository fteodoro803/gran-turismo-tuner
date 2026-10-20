import type { FieldDef, SectionDef } from '../tune/schema'
import type { Drivetrain, Tune } from '../tune/types'
import { FieldInput } from './FieldInput'
import type { ChangeHandler } from './FieldInput'

interface Props {
  section: SectionDef
  defaultOpen: boolean
  tune: Tune
  drivetrain?: Drivetrain
  onChange: ChangeHandler
}

interface FieldGroup {
  name?: string
  fields: FieldDef[]
}

// Splits a section's fields into runs that share a `group` (Front, Rear, Wheel).
//
// Runs are consecutive on purpose: in Differential the center differential has no group but
// comes after the Front and Rear ones, and merging by name would pull it up above them.
function groupFields(fields: readonly FieldDef[]): FieldGroup[] {
  const groups: FieldGroup[] = []
  for (const field of fields) {
    const last = groups.at(-1)
    if (last && last.name === field.group) last.fields.push(field)
    else groups.push({ name: field.group, fields: [field] })
  }
  return groups
}

// A collapsible card for one tuning section, built from the schema.
//
// <details>/<summary> is the browser's own expand/collapse, so it needs no state or JS. React
// only sets the initial `open`; after that the browser tracks what the user toggles.
export function SectionCard({ section, defaultOpen, tune, drivetrain, onChange }: Props) {
  return (
    <details className="card" open={defaultOpen}>
      <summary>{section.title}</summary>
      <div className="card-body">
        {groupFields(section.fields).map((group) => (
          <fieldset key={`${group.name ?? ''}:${group.fields[0].key}`} className="group">
            {group.name && <legend>{group.name}</legend>}
            <div className="fields">
              {group.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  tune={tune}
                  drivetrain={drivetrain}
                  onChange={onChange}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </details>
  )
}
