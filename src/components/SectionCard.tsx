import type { ReactNode } from 'react'
import type { FieldDef, SectionDef } from '../tune/schema'
import type { Drivetrain, Tune } from '../tune/types'
import type { Units } from '../tune/units'
import { FieldInput } from './FieldInput'
import type { ChangeHandler } from './FieldInput'

interface Props {
  section: SectionDef
  tune: Tune
  drivetrain?: Drivetrain
  onChange: ChangeHandler
  // Extra content under the heading, e.g. the car and drivetrain in General (#12).
  extra?: ReactNode
  // Extra content under the fields, e.g. the unit choices in General (#14).
  footer?: ReactNode
  units?: { stored: Units; shown: Units }
}

interface FieldGroup {
  name?: string
  fields: FieldDef[]
}

// A group on its own, or a Front group and a Rear group shown side by side.
type Block = { kind: 'group'; group: FieldGroup } | { kind: 'pair'; front: FieldGroup; rear: FieldGroup }

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

// True when a Front group and the Rear group after it list the same labels in the same order.
const isMatchingPair = (front: FieldGroup, rear: FieldGroup) =>
  front.name === 'Front' &&
  rear.name === 'Rear' &&
  front.fields.length === rear.fields.length &&
  front.fields.every((f, i) => f.label === rear.fields[i].label)

// Turns the groups into blocks, merging each matching Front and Rear into one pair (#20).
//
// Detected from the data instead of marked in the schema, so the schema stays as it is (D6).
// Anything that doesn't match, like Tires with its two plain Front and Rear fields, stays a group.
function toBlocks(groups: FieldGroup[]): Block[] {
  const blocks: Block[] = []
  for (let i = 0; i < groups.length; i++) {
    const next = groups[i + 1]
    if (next && isMatchingPair(groups[i], next)) {
      blocks.push({ kind: 'pair', front: groups[i], rear: next })
      i++
    } else {
      blocks.push({ kind: 'group', group: groups[i] })
    }
  }
  return blocks
}

// A flat panel for one tuning section, built from the schema.
//
// Always open, like the game's sheets (#20): every section is on one page.
export function SectionCard({ section, tune, drivetrain, onChange, extra, footer, units }: Props) {
  const input = (field: FieldDef, bare = false) => (
    <FieldInput
      key={field.key}
      field={field}
      tune={tune}
      drivetrain={drivetrain}
      onChange={onChange}
      bare={bare}
      units={units}
    />
  )

  return (
    <div className="panel">
      <h2>{section.title}</h2>
      {extra}
      {toBlocks(groupFields(section.fields)).map((block) => {
        // ===== Front and Rear side by side =====
        if (block.kind === 'pair') {
          return (
            <div key={`pair:${block.front.fields[0].key}`} className="pair">
              <div className="pair-head" aria-hidden="true">
                <span />
                <span>Front</span>
                <span>Rear</span>
              </div>
              {block.front.fields.map((field, i) => (
                <div key={field.key} className="pair-row">
                  <span className="pair-label" aria-hidden="true">
                    {field.label}
                  </span>
                  {input(field, true)}
                  {input(block.rear.fields[i], true)}
                </div>
              ))}
            </div>
          )
        }

        // ===== One group of plain rows =====
        const { group } = block
        return (
          <fieldset key={`${group.name ?? ''}:${group.fields[0].key}`} className="group">
            {group.name && <legend>{group.name}</legend>}
            <div className="fields">{group.fields.map((field) => input(field))}</div>
          </fieldset>
        )
      })}
      {footer}
    </div>
  )
}
