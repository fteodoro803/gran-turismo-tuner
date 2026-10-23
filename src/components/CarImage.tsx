import { useState } from 'react'
import { carImageUrl } from '../data/car-images'

// A car's picture on a card background, or nothing at all if it has none or the file isn't there.
//
// The pictures are Sony's and are not committed (D11), so a fresh clone or the portfolio deploy has
// no files. Hiding the card on a load error keeps those builds looking like the text-only app.
// Callers pass `key={car.id}` so a new car gets a fresh `failed` state.
export function CarImage({ image, className = '' }: { image?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!image || failed) return null
  return (
    <div className={`car-image ${className}`.trim()}>
      <img src={carImageUrl(image)} alt="" width={320} height={180} onError={() => setFailed(true)} />
    </div>
  )
}
