import { describe, expect, it } from 'vitest'
import { CARS } from '../data/cars'
import { decode, encode } from './codec'
import { defaultTune, withDefaults } from './defaults'
import { FIELDS } from './schema'
import type { Tune } from './types'

const fr = CARS.find((c) => c.drivetrain === 'FR')!
const fourWd = CARS.find((c) => c.drivetrain === '4WD')!

// The JSON a link holds, for checking what was left out.
const json = (link: string) => JSON.parse(atob(link.replace(/-/g, '+').replace(/_/g, '/')))

const sample: Tune = withDefaults({
  maxPower: 520,
  maxTorque: 61.5,
  boreUp: true,
  tiresFront: 'Racing Soft',
  suspension: 'Fully Customised Suspension',
  suspFrontToe: -0.05,
  gearRatios: { gears: [3.587, 2.022, 1.384], final: 4.1 },
})

describe('field numbers', () => {
  it('are unique whole numbers above zero', () => {
    const numbers = FIELDS.map((f) => f.n)
    expect(new Set(numbers).size).toBe(numbers.length)
    for (const n of numbers) expect(Number.isInteger(n) && n > 0, String(n)).toBe(true)
  })
})

describe('encode and decode', () => {
  it('round-trips a tune and its car', () => {
    const result = decode(encode({ tune: sample, car: fr }))
    expect(result?.car).toBe(fr)
    expect(result?.tune).toEqual(sample)
  })

  it('leaves defaults out of the link', () => {
    expect(json(encode({ tune: defaultTune(), car: fr }))).toEqual({ v: 1, c: fr.id, t: {} })
  })

  it('stores toggles as 1, enums by option position and gears as a list', () => {
    const { t } = json(encode({ tune: sample, car: fr }))
    const n = (key: string) => FIELDS.find((f) => f.key === key)!.n
    expect(t[n('boreUp')]).toBe(1)
    expect(t[n('tiresFront')]).toBe(8)
    expect(t[n('gearRatios')]).toEqual([[3.587, 2.022, 1.384], 4.1])
  })

  it('uses only characters that are safe in a URL', () => {
    expect(encode({ tune: sample, car: fr })).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('drops values for locked fields', () => {
    const tune = withDefaults({ diffFrontInitialTorque: 40, diffRearInitialTorque: 30 })
    const result = decode(encode({ tune, car: fr }))
    expect(result?.tune.diffFrontInitialTorque).toBeUndefined()
    expect(result?.tune.diffRearInitialTorque).toBe(30)
  })

  it('uses the linked car to decide what is locked', () => {
    const tune = withDefaults({ diffFrontInitialTorque: 40 })
    expect(decode(encode({ tune, car: fourWd }))?.tune.diffFrontInitialTorque).toBe(40)
  })
})

// A link made once and kept as text. If this fails, a field number or an enum's option order has
// changed, and every link already shared would now open as a different tune (#5). Only ever add
// new fields and options at the end.
describe('a saved link', () => {
  const SAVED =
    'eyJ2IjoxLCJjIjoxLCJ0Ijp7IjEiOjUyMCwiNyI6OCwiOSI6NCwiMTYiOi0wLjA1LCIzNSI6MiwiNDIiOltbMy41ODcsMi4wMjJdLDQuMV0sIjYyIjoxfX0'

  it('still opens as the same tune', () => {
    const result = decode(SAVED)
    expect(result?.car.id).toBe(1)
    expect(result?.tune).toEqual(
      withDefaults({
        maxPower: 520,
        tiresFront: 'Racing Soft',
        boreUp: true,
        suspension: 'Fully Customised Suspension',
        suspFrontToe: -0.05,
        ecu: 'Full Control Computer',
        gearRatios: { gears: [3.587, 2.022], final: 4.1 },
      }),
    )
  })
})

describe('decode on a bad link', () => {
  const link = (data: unknown) => btoa(JSON.stringify(data)).replace(/=+$/, '')

  it('returns undefined for text that is not a link', () => {
    for (const text of ['', 'not a link', '%%%', 'e30', link(null), link([1, 2]), link('hello')]) {
      expect(decode(text), text).toBeUndefined()
    }
  })

  it('returns undefined for a version it does not know', () => {
    expect(decode(link({ v: 2, c: fr.id, t: {} }))).toBeUndefined()
    expect(decode(link({ c: fr.id, t: {} }))).toBeUndefined()
  })

  it('returns undefined for a car that is not in the list', () => {
    expect(decode(link({ v: 1, c: 999999, t: {} }))).toBeUndefined()
    expect(decode(link({ v: 1, c: 'one', t: {} }))).toBeUndefined()
    expect(decode(link({ v: 1, t: {} }))).toBeUndefined()
  })

  it('ignores unknown field numbers and unreadable values, and keeps the rest', () => {
    const n = (key: string) => FIELDS.find((f) => f.key === key)!.n
    const result = decode(
      link({
        v: 1,
        c: fr.id,
        t: {
          [n('maxPower')]: 400,
          [n('tiresFront')]: 99,
          [n('boreUp')]: 'yes',
          [n('gearRatios')]: 'fast',
          9999: 1,
        },
      }),
    )
    expect(result?.tune.maxPower).toBe(400)
    expect(result?.tune.tiresFront).toBe('Comfort Hard')
    expect(result?.tune.boreUp).toBe(false)
    expect(result?.tune.gearRatios).toBeUndefined()
  })

  it('opens a link with no tune section as an empty tune', () => {
    expect(decode(link({ v: 1, c: fr.id }))?.tune).toEqual(defaultTune())
  })
})
