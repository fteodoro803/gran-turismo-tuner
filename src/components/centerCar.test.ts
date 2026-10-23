import { describe, expect, it } from 'vitest'
import { shiftFromAlpha } from './centerCar'

// A width x height RGBA picture, empty except for a solid box from (x0, y0) up to (x1, y1) exclusive.
function picture(width: number, height: number, [x0, y0, x1, y1]: number[]) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[(y * width + x) * 4 + 3] = 255
  return data
}

describe('shiftFromAlpha', () => {
  it('needs no shift when the car is already centred', () => {
    expect(shiftFromAlpha(picture(10, 10, [2, 3, 8, 7]), 10, 10)).toEqual({ x: 0, y: 0 })
  })

  it('shifts down when the car sits high, as a percentage of the picture', () => {
    // Box rows 0-4 of 10: centre 2.5, frame centre 5, so move down 2.5 rows = 25%.
    expect(shiftFromAlpha(picture(10, 10, [2, 0, 8, 5]), 10, 10)).toEqual({ x: 0, y: 25 })
  })

  it('shifts left when the car sits right', () => {
    // Box columns 6-9 of 10: centre 8, frame centre 5, so move left 3 columns = -30%.
    expect(shiftFromAlpha(picture(10, 10, [6, 3, 10, 7]), 10, 10)).toEqual({ x: -30, y: 0 })
  })

  it('leaves an empty picture alone', () => {
    expect(shiftFromAlpha(picture(10, 10, [0, 0, 0, 0]), 10, 10)).toEqual({ x: 0, y: 0 })
  })
})
