import { describe, expect, it } from 'vitest'
import { defaultTune, withDefaults } from './defaults'
import { clampValue, isEnabled, normaliseTune } from './rules'
import { FIELD_BY_KEY, FIELDS, SECTIONS } from './schema'

const field = (key: string) => FIELD_BY_KEY[key]

describe('schema', () => {
  it('has 17 sections and unique field keys', () => {
    expect(SECTIONS).toHaveLength(17)
    expect(new Set(FIELDS.map((f) => f.key)).size).toBe(FIELDS.length)
  })
})

describe('defaults', () => {
  it('uses the first option for enums and false for toggles', () => {
    const tune = defaultTune()
    expect(tune.tiresFront).toBe('Comfort Hard')
    expect(tune.ecu).toBe('Normal')
    expect(tune.nitrous).toBe('None')
    expect(tune.boreUp).toBe(false)
  })

  it('leaves numbers unset', () => {
    expect(defaultTune().maxPower).toBeUndefined()
  })

  it('lets a partial tune override the defaults', () => {
    expect(withDefaults({ ecu: 'Sport Computer' }).ecu).toBe('Sport Computer')
    expect(withDefaults({ ecu: 'Sport Computer' }).brakes).toBe('Normal')
  })
})

describe('clampValue', () => {
  it('rounds integers and applies min and max', () => {
    expect(clampValue(field('ecuOutput'), 120)).toBe(100)
    expect(clampValue(field('ecuOutput'), -3)).toBe(0)
    expect(clampValue(field('ballastPosition'), -80)).toBe(-50)
    expect(clampValue(field('brakeFrontRearBalance'), 2.6)).toBe(3)
  })

  it('keeps the right number of decimals', () => {
    expect(clampValue(field('maxTorque'), 450.26)).toBe(450.3)
    expect(clampValue(field('suspFrontNaturalFrequency'), 2.456)).toBe(2.46)
    expect(clampValue(field('suspFrontNegativeCamber'), 1.27)).toBe(1.3)
  })

  it('sends a torque split below 5 to 5 and above 50 to 50', () => {
    expect(clampValue(field('torqueSplitFront'), 4)).toBe(5)
    expect(clampValue(field('torqueSplitFront'), 51)).toBe(50)
    expect(clampValue(field('torqueSplitFront'), 30)).toBe(30)
  })

  it('rejects numbers that are not finite and enums that do not exist', () => {
    expect(clampValue(field('maxPower'), Number.NaN)).toBeUndefined()
    expect(clampValue(field('ecu'), 'Turbo')).toBeUndefined()
    expect(clampValue(field('boreUp'), 'yes')).toBeUndefined()
  })

  it('limits gears to 8, rounds to 3 decimals and keeps the final gear', () => {
    const result = clampValue(field('gearRatios'), {
      gears: [3.5456, 2.1, 1, 1, 1, 1, 1, 1, 1, 1],
      final: 4.1,
    }) as { gears: number[]; final?: number }
    expect(result.gears).toHaveLength(8)
    expect(result.gears[0]).toBe(3.546)
    expect(result.final).toBe(4.1)
  })

  it('stops the gear list at the first unusable gear', () => {
    const result = clampValue(field('gearRatios'), { gears: [3, 'x', 2] })
    expect(result).toEqual({ gears: [3] })
  })

  it('drops an empty gear set', () => {
    expect(clampValue(field('gearRatios'), { gears: [] })).toBeUndefined()
  })
})

describe('isEnabled', () => {
  it('enables the front differential only for FF, 4WD and Other', () => {
    const tune = {}
    expect(isEnabled('diffFrontInitialTorque', tune, 'FF')).toBe(true)
    expect(isEnabled('diffFrontInitialTorque', tune, '4WD')).toBe(true)
    expect(isEnabled('diffFrontInitialTorque', tune, 'Other')).toBe(true)
    expect(isEnabled('diffFrontInitialTorque', tune, 'FR')).toBe(false)
    expect(isEnabled('diffFrontInitialTorque', tune, 'MR')).toBe(false)
    expect(isEnabled('diffFrontInitialTorque', tune, 'RR')).toBe(false)
  })

  it('disables the rear differential only for FF', () => {
    const tune = {}
    expect(isEnabled('diffRearBrakingSensitivity', tune, 'FF')).toBe(false)
    expect(isEnabled('diffRearBrakingSensitivity', tune, 'FR')).toBe(true)
    expect(isEnabled('diffRearBrakingSensitivity', tune, '4WD')).toBe(true)
    expect(isEnabled('diffRearBrakingSensitivity', tune, 'Other')).toBe(true)
  })

  it('enables the center differential and torque split only for 4WD', () => {
    expect(isEnabled('torqueSplitFront', {}, '4WD')).toBe(true)
    expect(isEnabled('torqueSplitFront', {}, 'FR')).toBe(false)
    expect(isEnabled('torqueSplitFront', {}, 'Other')).toBe(false)
    expect(isEnabled('centerDifferential', {}, 'FF')).toBe(false)
  })

  it('enables everything drivetrain-related before a car is chosen', () => {
    expect(isEnabled('diffFrontInitialTorque', {})).toBe(true)
    expect(isEnabled('diffRearInitialTorque', {})).toBe(true)
    expect(isEnabled('torqueSplitFront', {})).toBe(true)
  })

  it('disables Anti-Lag System when Anti-Lag is None or missing', () => {
    expect(isEnabled('antiLagSystem', {})).toBe(false)
    expect(isEnabled('antiLagSystem', { antiLag: 'None' })).toBe(false)
    expect(isEnabled('antiLagSystem', { antiLag: 'Anti-Lag System' })).toBe(true)
  })

  it('disables Handbrake Torque when the handbrake is Normal', () => {
    expect(isEnabled('handbrakeTorque', {})).toBe(false)
    expect(isEnabled('handbrakeTorque', { handbrake: 'Hydraulic Handbrake' })).toBe(true)
  })

  it('locks suspension inputs unless Fully Customised', () => {
    expect(isEnabled('suspFrontToe', { suspension: 'Sports Suspension' })).toBe(false)
    expect(isEnabled('suspRearAntiRollBar', {})).toBe(false)
    expect(isEnabled('suspRearAntiRollBar', { suspension: 'Fully Customised Suspension' })).toBe(true)
  })
})

describe('normaliseTune', () => {
  it('drops values for disabled fields and keeps the rest', () => {
    const result = normaliseTune(
      { maxPower: 500, diffFrontInitialTorque: 20, diffRearInitialTorque: 30, torqueSplitFront: 40 },
      'FF',
    )
    expect(result.maxPower).toBe(500)
    expect(result.diffFrontInitialTorque).toBe(20)
    expect(result.diffRearInitialTorque).toBeUndefined()
    expect(result.torqueSplitFront).toBeUndefined()
  })

  it('clamps values and removes unknown keys', () => {
    const dirty = { ecuOutput: 150, nonsense: 1 } as unknown as Parameters<typeof normaliseTune>[0]
    const result = normaliseTune(dirty)
    expect(result.ecuOutput).toBe(100)
    expect('nonsense' in result).toBe(false)
  })

  it('keeps a locked value in the editing copy but drops it once normalised', () => {
    const editing = { suspension: 'Sports Suspension', suspFrontToe: 0.1 } as const
    expect(editing.suspFrontToe).toBe(0.1)
    expect(normaliseTune(editing).suspFrontToe).toBeUndefined()
  })
})
