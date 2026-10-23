// The picture card with no picture in it: a big question mark while no car is chosen, and empty
// when a chosen car has no picture file (D11).
//
// It sits on the same card as a real picture so the picker's layout doesn't change when one
// replaces the other.
export function CarPlaceholder({ unknown = false }: { unknown?: boolean }) {
  return (
    <div className="car-image car-placeholder">
      {unknown && (
        <span role="img" aria-label="No car chosen">
          ?
        </span>
      )}
    </div>
  )
}
