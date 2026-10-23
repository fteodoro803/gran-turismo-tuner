import { useState } from 'react'
import { CarPicker } from './components/CarPicker'
import type { CarChoice } from './components/CarPicker'
import { TuneForm } from './components/TuneForm'
import type { ChangeHandler } from './components/FieldInput'
import { CARS } from './data/cars'
import { decode } from './tune/codec'
import { defaultTune } from './tune/defaults'
import type { UnitFamily } from './tune/schema'
import type { Tune } from './tune/types'
import { DEFAULT_UNITS, convertField, familyOf, fieldsInFamily, loadSavedUnits, saveUnits } from './tune/units'
import type { Units } from './tune/units'

// What the app starts with: the tune and car from a share link in the address, if there is one.
//
// 1. No `#` in the address: start empty on the car picker.
// 2. A `#` that decodes: start on the tuning page with that car and tune, ready to edit (#5).
// 3. A `#` that does not decode: start empty, and say the link could not be opened.
function readStart() {
  const hash = window.location.hash.slice(1)
  const linked = hash ? decode(hash) : undefined
  return {
    tune: linked?.tune ?? defaultTune(),
    units: linked?.units ?? DEFAULT_UNITS,
    choice: linked ? { car: linked.car } : undefined,
    brokenLink: hash !== '' && !linked,
  }
}

// Two pages, switched by plain state: the car picker first, then the tuning form (#12).
//
// The page lives in memory and not in the URL, so it doesn't clash with the share-link format
// that puts the tune after the `#` (#5). The tune is kept when you go back to change the car.
export default function App() {
  const [start] = useState(readStart)
  const [tune, setTune] = useState<Tune>(start.tune)
  const [choice, setChoice] = useState<CarChoice | undefined>(start.choice)
  const [page, setPage] = useState<'picker' | 'tune'>(start.choice ? 'tune' : 'picker')
  const [brokenLink, setBrokenLink] = useState(start.brokenLink)
  // The unit each number was typed in (kept in the link), and the unit shown, which is this
  // viewer's saved choice and falls back to the author's (#14).
  const [storedUnits, setStoredUnits] = useState<Units>(start.units)
  const [shownUnits, setShownUnits] = useState<Units>(() => ({ ...start.units, ...loadSavedUnits() }))

  const handleChangeUnit = (family: UnitFamily, unit: string) => {
    const next = { ...shownUnits, [family]: unit } as Units
    setShownUnits(next)
    saveUnits(next)
  }

  // Sets one field, or removes its key when the value is undefined (an emptied number box).
  //
  // The updater form `setTune(prev => ...)` gets the latest state, so two quick changes
  // can't overwrite each other. State is never mutated: we copy, then change the copy.
  //
  // A number is typed in the shown unit, so it becomes the stored unit for its family. If that
  // differs from the old stored unit, the family's other numbers are converted so they stay right.
  const handleChange: ChangeHandler = (key, value) => {
    const family = familyOf(key)
    const rebase = family !== undefined && storedUnits[family] !== shownUnits[family]
    if (family && rebase) setStoredUnits((u) => ({ ...u, [family]: shownUnits[family] }))
    setTune((prev) => {
      const next: Record<string, unknown> = { ...prev }
      if (family && rebase) {
        for (const other of fieldsInFamily(family)) {
          const old = next[other.key]
          if (other.key !== key && typeof old === 'number') next[other.key] = convertField(other, old, storedUnits, shownUnits)
        }
      }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next as Tune
    })
  }

  return (
    <main>
      {page === 'tune' && choice ? (
        <TuneForm
          tune={tune}
          choice={choice}
          onChange={handleChange}
          onChangeCar={() => setPage('picker')}
          storedUnits={storedUnits}
          shownUnits={shownUnits}
          onChangeUnit={handleChangeUnit}
        />
      ) : (
        <CarPicker
          cars={CARS}
          initial={choice}
          notice={brokenLink ? "Couldn't open this link. Pick a car to start a new tune." : undefined}
          onEnter={(c) => {
            setBrokenLink(false)
            setChoice(c)
            setPage('tune')
          }}
        />
      )}
    </main>
  )
}
