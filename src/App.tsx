import { useState } from 'react'
import { TuneForm } from './components/TuneForm'
import type { ChangeHandler } from './components/FieldInput'
import { DRIVETRAINS } from './tune/schema'
import { defaultTune } from './tune/defaults'
import type { Drivetrain, Tune } from './tune/types'

const isDrivetrain = (s: string): s is Drivetrain => (DRIVETRAINS as readonly string[]).includes(s)

export default function App() {
  const [tune, setTune] = useState<Tune>(defaultTune)
  const [drivetrain, setDrivetrain] = useState<Drivetrain | undefined>()

  // Sets one field, or removes its key when the value is undefined (an emptied number box).
  //
  // The updater form `setTune(prev => ...)` gets the latest state, so two quick changes
  // can't overwrite each other. State is never mutated: we copy, then change the copy.
  const handleChange: ChangeHandler = (key, value) => {
    setTune((prev) => {
      const next: Record<string, unknown> = { ...prev }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next as Tune
    })
  }

  return (
    <main>
      <a href="../">← Back to Lab</a>
      <h1>GT7 Tune Sharing</h1>
      <p>Fan project, not affiliated with Sony Interactive Entertainment or Polyphony Digital.</p>

      {/* ===== Drivetrain preview (temporary) ===== */}
      {/* Stands in for the car picker until issue #12 lands, then this block is removed. */}
      <div className="field preview-drivetrain">
        <label htmlFor="drivetrain-preview">Drivetrain (preview)</label>
        <select
          id="drivetrain-preview"
          value={drivetrain ?? ''}
          onChange={(e) => setDrivetrain(isDrivetrain(e.target.value) ? e.target.value : undefined)}
        >
          <option value="">None chosen</option>
          {DRIVETRAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Tuning form ===== */}
      <TuneForm tune={tune} drivetrain={drivetrain} onChange={handleChange} />
    </main>
  )
}
