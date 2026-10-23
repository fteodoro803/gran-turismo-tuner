import { useId, useState } from 'react'
import { DRIVETRAINS } from '../tune/schema'
import type { Drivetrain } from '../tune/types'
import { CarImage } from './CarImage'

// The shape of one car in src/data/cars.json (#4).
//
// `image` is the picture's path under the site root, like `car-images/ford/gt-race-car-2018.png`.
// It is optional so a car can have no picture, or a different file type, later (D11).
export interface Car {
  id: string
  manufacturer: string
  name: string
  drivetrain: Drivetrain
  image?: string
}

// What the first page hands to the tuning page: the car (none if it isn't listed) and its drivetrain.
export interface CarChoice {
  car?: Car
  drivetrain: Drivetrain
}

interface Props {
  cars: readonly Car[]
  // The earlier choice, so "Change car" opens the picker where you left it.
  initial?: CarChoice
  onEnter: (choice: CarChoice) => void
}

// A manufacturer value that can't clash with a real name.
const NOT_LISTED = '__not-listed__'

const isDrivetrain = (s: string): s is Drivetrain => (DRIVETRAINS as readonly string[]).includes(s)

// The first page: title, disclaimer, and the car picker that opens the tuning page (#12).
//
// Manufacturer comes first, then the models of that make. "My car isn't listed" swaps the model
// for a drivetrain dropdown, so the app stays usable for a car missing from the list. The Enter
// button stays disabled until there is something to enter with.
export function CarPicker({ cars, initial, onEnter }: Props) {
  const ids = { maker: useId(), model: useId(), drivetrain: useId() }
  const [maker, setMaker] = useState(() =>
    initial ? (initial.car ? initial.car.manufacturer : NOT_LISTED) : '',
  )
  const [carId, setCarId] = useState(initial?.car?.id ?? '')
  const [unlisted, setUnlisted] = useState<string>(initial && !initial.car ? initial.drivetrain : '')

  const makers = [...new Set(cars.map((c) => c.manufacturer))].sort()
  const models = cars.filter((c) => c.manufacturer === maker)
  const car = models.find((c) => c.id === carId)

  // What Enter would send, or null while the picker isn't complete.
  const choice: CarChoice | null =
    maker === NOT_LISTED
      ? isDrivetrain(unlisted)
        ? { drivetrain: unlisted }
        : null
      : car
        ? { car, drivetrain: car.drivetrain }
        : null

  return (
    <div className="landing">
      <a href="../">← Back to Lab</a>
      <h1>GT7 Tune Sharing</h1>
      <p>Fan project, not affiliated with Sony Interactive Entertainment or Polyphony Digital.</p>

      <form
        className="panel picker"
        onSubmit={(e) => {
          e.preventDefault()
          if (choice) onEnter(choice)
        }}
      >
        <h2>Choose a car</h2>

        {/* ===== Manufacturer ===== */}
        <div className="field">
          <label htmlFor={ids.maker}>Manufacturer</label>
          <select
            id={ids.maker}
            value={maker}
            onChange={(e) => {
              setMaker(e.target.value)
              setCarId('')
            }}
          >
            <option value="">Choose…</option>
            {makers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            <option value={NOT_LISTED}>My car isn't listed</option>
          </select>
        </div>

        {/* ===== Model, or a drivetrain when the car isn't listed ===== */}
        {maker === NOT_LISTED ? (
          <div className="field">
            <label htmlFor={ids.drivetrain}>Drivetrain</label>
            <select id={ids.drivetrain} value={unlisted} onChange={(e) => setUnlisted(e.target.value)}>
              <option value="">Choose…</option>
              {DRIVETRAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor={ids.model}>Model</label>
              <select
                id={ids.model}
                value={carId}
                disabled={maker === ''}
                onChange={(e) => setCarId(e.target.value)}
              >
                <option value="">Choose…</option>
                {models.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {car && (
              <>
                <CarImage key={car.id} image={car.image} />
                <div className="readout-row">
                  <span>Drivetrain</span>
                  <strong>{car.drivetrain}</strong>
                </div>
              </>
            )}
          </>
        )}

        <button type="submit" className="button" disabled={!choice}>
          Enter
        </button>
      </form>
    </div>
  )
}
