import { describe, expect, it } from 'vitest'
import { BASE_PX, COLUMN_REM, GAP_REM, MAX_SCALE, PAGE_PAD_X_REM, chooseFit } from './fit'

// About what the whole form measures at scale 1 in one column (see PROJECT_CONTEXT, #20).
const CONTENT = 3400

describe('chooseFit', () => {
  it('leaves phones at one column and normal size', () => {
    expect(chooseFit(390, 844, CONTENT)).toEqual({ columns: 1, scale: 1 })
  })

  it('does nothing before the page has been measured', () => {
    expect(chooseFit(1280, 800, 0)).toEqual({ columns: 1, scale: 1 })
  })

  it('uses more columns on wide screens than on a portrait tablet', () => {
    const desktop = chooseFit(1920, 1080, CONTENT)
    const tablet = chooseFit(768, 1024, CONTENT)
    expect(desktop.columns).toBeGreaterThan(tablet.columns)
  })

  it('never scales above the maximum', () => {
    expect(chooseFit(3840, 2160, CONTENT).scale).toBeLessThanOrEqual(MAX_SCALE)
  })

  it.each([
    [1920, 1080],
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [768, 600],
  ])('fits a %i by %i screen by width', (width, height) => {
    const { columns, scale } = chooseFit(width, height, CONTENT)
    const neededWidth =
      scale * BASE_PX * (columns * COLUMN_REM + (columns - 1) * GAP_REM + 2 * PAGE_PAD_X_REM)
    expect(neededWidth).toBeLessThanOrEqual(width + 0.001)
  })
})
