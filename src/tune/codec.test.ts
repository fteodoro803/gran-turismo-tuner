import { describe, expect, it } from 'vitest'
import { CARS } from '../data/cars'
import { decode, encode } from './codec'
import { defaultTune, withDefaults } from './defaults'
import { FIELDS } from './schema'
import type { Tune } from './types'

const fr = CARS.find((c) => c.drivetrain === 'FR')!
const fourWd = CARS.find((c) => c.drivetrain === '4WD')!

const n = (key: string) => FIELDS.find((f) => f.key === key)!.n

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
    expect(encode({ tune: defaultTune(), car: fr })).toBe(`2,${fr.id},0`)
  })

  it('writes enums by option position, numbers as they are and gears as a list', () => {
    const pairs = encode({ tune: sample, car: fr }).split(',').slice(3)
    expect(pairs).toContain(`${n('tiresFront')}:8`)
    expect(pairs).toContain(`${n('maxPower')}:520`)
    expect(pairs).toContain(`${n('suspFrontToe')}:-0.05`)
    expect(pairs).toContain(`${n('gearRatios')}:3.587/2.022/1.384~4.1`)
  })

  it('packs every toggle that is on into one number, not one entry each', () => {
    const tune = withDefaults({ boreUp: true, strokeUp: true, bodyRigidity: true })
    const parts = encode({ tune, car: fr }).split(',')
    expect(parts).toHaveLength(3)
    const all = withDefaults({ boreUp: true, strokeUp: true, bodyRigidity: true })
    expect(decode(parts.join(','))?.tune).toEqual(all)
  })

  it('uses only characters that are safe in a URL', () => {
    expect(encode({ tune: sample, car: fr })).toMatch(/^[0-9a-z.,:~/-]+$/)
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
  const SAVED = '1,1,32qytpjad81b56o,1:520,7:8,9:4,16:-0.05,35:2,42:3.587/2.022~4.1'

  it('still opens as the same tune', () => {
    const result = decode(SAVED)
    expect(result?.car.id).toBe(1)
    expect(result?.tune).toEqual(
      withDefaults({
        maxPower: 520,
        tiresFront: 'Racing Soft',
        boreUp: true,
        bodyRigidity: true,
        suspension: 'Fully Customised Suspension',
        suspFrontToe: -0.05,
        ecu: 'Full Control Computer',
        gearRatios: { gears: [3.587, 2.022], final: 4.1 },
      }),
    )
  })
})

describe('units in a link', () => {
  const typed = { power: 'PS', torque: 'Nm', weight: 'lbs' } as const

  it('round-trips the units the numbers were typed in', () => {
    const link = encode({ tune: sample, car: fr, units: typed })
    expect(link.split(',')).toContain('u:211')
    expect(decode(link)?.units).toEqual(typed)
  })

  it('leaves the units out when they are all the defaults', () => {
    expect(encode({ tune: sample, car: fr }).split(',').some((p) => p.startsWith('u:'))).toBe(false)
    expect(decode(encode({ tune: sample, car: fr }))?.units).toEqual({ power: 'HP', torque: 'ft-lb', weight: 'kg' })
  })

  it('falls back to the default for a unit it cannot read', () => {
    expect(decode(`2,${fr.id},0,u:9x1`)?.units).toEqual({ power: 'HP', torque: 'ft-lb', weight: 'lbs' })
  })

  it('opens a version 1 link with the default units', () => {
    expect(decode(`1,${fr.id},0,${n('maxPower')}:400`)?.units).toEqual({ power: 'HP', torque: 'ft-lb', weight: 'kg' })
  })
})

describe('decode on a bad link', () => {
  it('returns undefined for text that is not a link', () => {
    for (const text of ['', 'not a link', '%%%', '1', '1,', '1,1', '1,1,', 'eyJ2IjoxfQ']) {
      expect(decode(text), text).toBeUndefined()
    }
  })

  it('returns undefined for a version it does not know', () => {
    expect(decode(`3,${fr.id},0`)).toBeUndefined()
    expect(decode(`${fr.id},0`)).toBeUndefined()
  })

  it('returns undefined for a car that is not in the list', () => {
    expect(decode('1,999999,0')).toBeUndefined()
    expect(decode('1,one,0')).toBeUndefined()
    expect(decode('1,-3,0')).toBeUndefined()
  })

  it('returns undefined when the toggles are not a base 36 number', () => {
    expect(decode(`1,${fr.id},!!`)).toBeUndefined()
    expect(decode(`1,${fr.id},-1`)).toBeUndefined()
  })

  it('ignores unknown field numbers and unreadable values, and keeps the rest', () => {
    const link = [
      `1,${fr.id},0`,
      `${n('maxPower')}:400`,
      `${n('tiresFront')}:99`,
      `${n('maxTorque')}:fast`,
      `${n('gearRatios')}:3.5/x`,
      `${n('boreUp')}:1`,
      '9999:1',
      'junk',
    ].join(',')
    const result = decode(link)
    expect(result?.tune.maxPower).toBe(400)
    expect(result?.tune.tiresFront).toBe('Comfort Hard')
    expect(result?.tune.maxTorque).toBeUndefined()
    expect(result?.tune.gearRatios).toBeUndefined()
    expect(result?.tune.boreUp).toBe(false)
  })

  it('opens a link with no fields as an empty tune', () => {
    expect(decode(`1,${fr.id},0`)?.tune).toEqual(defaultTune())
  })
})
