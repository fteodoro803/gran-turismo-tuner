import { useState } from 'react'
import { CarPicker } from './components/CarPicker'
import type { CarChoice } from './components/CarPicker'
import { TuneForm } from './components/TuneForm'
import type { ChangeHandler } from './components/FieldInput'
import { CARS } from './data/cars'
import { defaultTune } from './tune/defaults'
import type { Tune } from './tune/types'

// Two pages, switched by plain state: the car picker first, then the tuning form (#12).
//
// The page lives in memory and not in the URL, so it doesn't clash with the share-link format
// that puts the tune after the `#` (#5). The tune is kept when you go back to change the car.
export default function App() {
  const [tune, setTune] = useState<Tune>(defaultTune)
  const [choice, setChoice] = useState<CarChoice | undefined>()
  const [page, setPage] = useState<'picker' | 'tune'>('picker')

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
      {page === 'tune' && choice ? (
        <TuneForm
          tune={tune}
          choice={choice}
          onChange={handleChange}
          onChangeCar={() => setPage('picker')}
        />
      ) : (
        <CarPicker
          cars={CARS}
          initial={choice}
          onEnter={(c) => {
            setChoice(c)
            setPage('tune')
          }}
        />
      )}
    </main>
  )
}
