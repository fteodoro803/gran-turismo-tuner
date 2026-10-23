import { useRef } from 'react'
import { SECTIONS } from '../tune/schema'
import type { SectionDef } from '../tune/schema'
import type { Tune } from '../tune/types'
import { CarSummary } from './CarSummary'
import type { CarChoice } from './CarPicker'
import type { ChangeHandler } from './FieldInput'
import { SectionCard } from './SectionCard'
import { useFitToScreen } from './useFitToScreen'

interface Props {
  tune: Tune
  choice: CarChoice
  onChange: ChangeHandler
  onChangeCar: () => void
}

// Sections kept in one block, so a column break never separates them (#20).
// Tires sits directly above Suspension, like the game.
const STACKS: readonly (readonly string[])[] = [['tires', 'suspension']]

const isInLaterPosition = (id: string) => STACKS.some((stack) => stack.indexOf(id) > 0)

// The whole tuning form: every schema section as a panel, in schema order, on one page.
//
// The panels flow down through CSS columns (never split across two). How many columns, and the
// size of everything, is chosen by useFitToScreen so the page doesn't scroll on a tablet or larger.
export function TuneForm({ tune, choice, onChange, onChangeCar }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  useFitToScreen(formRef)

  const card = (section: SectionDef) => (
    <SectionCard
      key={section.id}
      section={section}
      tune={tune}
      drivetrain={choice.car.drivetrain}
      onChange={onChange}
      extra={section.id === 'general' ? <CarSummary choice={choice} onChangeCar={onChangeCar} /> : undefined}
    />
  )

  return (
    <>
      {/* ===== Back to the car picker ===== */}
      <button type="button" className="back-button" onClick={onChangeCar}>
        ← Back
      </button>

      {/* ===== Panels ===== */}
      <form ref={formRef} className="tune-form" onSubmit={(e) => e.preventDefault()}>
        {SECTIONS.map((section) => {
          // 1. A section that follows another in a stack is drawn inside that stack, not here.
          if (isInLaterPosition(section.id)) return null
          // 2. The first section of a stack draws the whole stack as one block.
          const stack = STACKS.find((s) => s[0] === section.id)
          if (!stack) return card(section)
          return (
            <div key={section.id} className="stack">
              {stack.map((id) => card(SECTIONS.find((s) => s.id === id)!))}
            </div>
          )
        })}
      </form>
    </>
  )
}
