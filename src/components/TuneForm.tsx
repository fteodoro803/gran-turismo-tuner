import { SECTIONS } from '../tune/schema'
import type { Drivetrain, Tune } from '../tune/types'
import type { ChangeHandler } from './FieldInput'
import { SectionCard } from './SectionCard'

interface Props {
  tune: Tune
  drivetrain?: Drivetrain
  onChange: ChangeHandler
}

// How many sections start expanded; the rest start collapsed to keep the page short.
const OPEN_SECTIONS = 3

// The whole tuning form: one collapsible card per schema section, in schema order.
export function TuneForm({ tune, drivetrain, onChange }: Props) {
  return (
    <form className="tune-form" onSubmit={(e) => e.preventDefault()}>
      {SECTIONS.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          defaultOpen={index < OPEN_SECTIONS}
          tune={tune}
          drivetrain={drivetrain}
          onChange={onChange}
        />
      ))}
    </form>
  )
}
