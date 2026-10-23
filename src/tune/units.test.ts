import { describe, expect, it } from 'vitest'
import { DEFAULT_UNITS, convert, packUnits, parseUnits } from './units'

describe('convert', () => {
  it('leaves a number alone when the unit does not change', () => {
    expect(convert('power', 450, 'HP', 'HP', 0)).toBe(450)
  })

  it('treats BHP as the same size as HP', () => {
    expect(convert('power', 450, 'HP', 'BHP', 0)).toBe(450)
  })

  it('converts between HP and PS, rounded to the nearest whole number', () => {
    expect(convert('power', 450, 'HP', 'PS', 0)).toBe(456)
    expect(convert('power', 456, 'PS', 'HP', 0)).toBe(450)
  })

  it('converts weight and keeps a torque decimal', () => {
    expect(convert('weight', 1200, 'kg', 'lbs', 0)).toBe(2646)
    expect(convert('torque', 61.5, 'ft-lb', 'Nm', 1)).toBe(83.4)
  })
})

describe('unit text', () => {
  it('writes nothing for the defaults and a position per family otherwise', () => {
    expect(packUnits(DEFAULT_UNITS)).toBeUndefined()
    expect(packUnits({ power: 'PS', torque: 'ft-lb', weight: 'lbs' })).toBe('201')
  })

  it('reads it back, using the default for a part it cannot read', () => {
    expect(parseUnits('201')).toEqual({ power: 'PS', torque: 'ft-lb', weight: 'lbs' })
    expect(parseUnits('')).toEqual(DEFAULT_UNITS)
    expect(parseUnits('9')).toEqual(DEFAULT_UNITS)
  })
})
