import { useId, useState } from 'react'
import type { Drivetrain } from '../tune/types'
import { CarImage } from './CarImage'
import { CarPlaceholder } from './CarPlaceholder'

// The shape of one car in src/data/cars.json (#4).
//
// `image` is the picture's path under the site root, like `car-images/ford/gt-race-car-2018.png`.
// It is optional so a car can have no picture, or a different file type, later (D11).
export interface Car {
  id: number
  manufacturer: string
  name: string
  drivetrain: Drivetrain
  image?: string
}

// What the first page hands to the tuning page. A tune always has a car; its drivetrain is `car.drivetrain`.
export interface CarChoice {
  car: Car
}

interface Props {
  cars: readonly Car[]
  // The earlier choice, so "Change car" opens the picker where you left it.
  initial?: CarChoice
  // A message shown under the disclaimer, such as a share link that could not be opened.
  notice?: string
  onEnter: (choice: CarChoice) => void
}

// The first page: title, disclaimer, and the car picker that opens the tuning page (#12).
//
// Manufacturer comes first, then the models of that make. The Enter button stays disabled until
// a car is chosen.
export function CarPicker({ cars, initial, notice, onEnter }: Props) {
  const ids = { maker: useId(), model: useId() }
  const [maker, setMaker] = useState(initial?.car.manufacturer ?? '')
  const [carId, setCarId] = useState<number | null>(initial?.car.id ?? null)

  const makers = [...new Set(cars.map((c) => c.manufacturer))].sort()
  const models = cars.filter((c) => c.manufacturer === maker)
  const car = models.find((c) => c.id === carId)

  // What Enter would send, or null while the picker isn't complete.
  const choice: CarChoice | null = car ? { car } : null

  return (
    <div className="landing">
      <a href="../">← Back to Projects</a>
      <h1>GT7 Tune Sharing</h1>
      <p>Fan project, not affiliated with Sony Interactive Entertainment or Polyphony Digital.</p>
      {notice && <p role="alert" className="notice">{notice}</p>}

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
              setCarId(null)
            }}
          >
            <option value="">Choose…</option>
            {makers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Model ===== */}
        <div className="field">
          <label htmlFor={ids.model}>Model</label>
          <select
            id={ids.model}
            value={carId ?? ''}
            disabled={maker === ''}
            onChange={(e) => setCarId(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Choose…</option>
            {models.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Picture and drivetrain: always drawn, so Enter stays put as the choice changes ===== */}
        {car ? (
          <CarImage key={car.id} image={car.image} fallback={<CarPlaceholder />} />
        ) : (
          <CarPlaceholder />
        )}
        <div className="readout-row">
          <span>Drivetrain</span>
          <strong>{car ? car.drivetrain : '—'}</strong>
        </div>

        <button type="submit" className="button" disabled={!choice}>
          Enter
        </button>
      </form>
    </div>
  )
}
