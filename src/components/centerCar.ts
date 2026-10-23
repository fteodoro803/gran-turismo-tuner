// How far to shift a car picture so the car, not the file, sits in the middle of its card.
//
// Sony's pictures are all 320x180 but the car sits anywhere in that frame, with empty margin that
// differs per file (D11), so centering the file leaves some cars high or low. The shift is returned
// as a percentage of the picture's own size so it still lands right at any display size.
export type Shift = { x: number; y: number }

// Alpha below this counts as empty, so a faint shadow edge doesn't drag the measured box outwards.
const ALPHA_CUTOFF = 8

// The shift that moves the box around the visible pixels onto the picture's centre.
//
// 1. Scan the RGBA data for the smallest box holding every pixel above the alpha cutoff.
// 2. Compare that box's centre with the frame's centre.
// A fully empty picture needs no shift.
export function shiftFromAlpha(data: Uint8ClampedArray, width: number, height: number): Shift {
  let minX = width
  let maxX = -1
  let minY = height
  let maxY = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= ALPHA_CUTOFF) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < 0) return { x: 0, y: 0 }
  return {
    x: ((width - (minX + maxX + 1)) / 2 / width) * 100,
    y: ((height - (minY + maxY + 1)) / 2 / height) * 100,
  }
}

// The shift for a loaded picture, or none if its pixels can't be read.
//
// The canvas read can throw (a tainted canvas) or be missing (jsdom in tests). Either way the
// picture just stays where the file puts it, so nothing here may break the card.
export function measureShift(img: HTMLImageElement): Shift | null {
  try {
    const { naturalWidth: width, naturalHeight: height } = img
    if (!width || !height) return null
    const context = Object.assign(document.createElement('canvas'), { width, height }).getContext('2d')
    if (!context) return null
    context.drawImage(img, 0, 0)
    return shiftFromAlpha(context.getImageData(0, 0, width, height).data, width, height)
  } catch {
    return null
  }
}
