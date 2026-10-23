// The picture card with nothing in it: shown while no car is chosen, and when a chosen car has no
// picture file (D11).
//
// It sits on the same card as a real picture so the picker's layout doesn't change when one
// replaces the other. The big question mark that used to fill it is gone until there are
// pictures of our own (D20).
export function CarPlaceholder() {
  return <div className="car-image car-placeholder" />
}
