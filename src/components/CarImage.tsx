import { useState, type ReactNode } from 'react'
import { carImageUrl } from '../data/car-images'
import { measureShift, type Shift } from './centerCar'

// A car's picture on a card background, or `fallback` (nothing by default) if it has none or the
// file isn't there.
//
// The pictures are Sony's and are not committed (D11), so a fresh clone or the portfolio deploy has
// no files. Hiding the card on a load error keeps those builds looking like the text-only app.
// Once loaded, the picture is shifted so the car itself is centred in the card, whatever margin its
// file has. Callers pass `key={car.id}` so a new car gets a fresh `failed` and shift state.
export function CarImage({
  image,
  className = '',
  fallback = null,
}: {
  image?: string
  className?: string
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState(false)
  const [shift, setShift] = useState<Shift | null>(null)
  if (!image || failed) return fallback
  return (
    <div className={`car-image ${className}`.trim()}>
      <img
        src={carImageUrl(image)}
        alt=""
        width={320}
        height={180}
        style={shift ? { transform: `translate(${shift.x}%, ${shift.y}%)` } : undefined}
        onLoad={(event) => setShift(measureShift(event.currentTarget))}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
