import { describe, expect, it } from 'vitest'
import { DRIVETRAINS } from '../tune/schema'
import { CARS } from './cars'

// The picture files that exist on this machine, as paths under public/. The glob only lists them,
// it doesn't load them.
const PICTURE_PATHS = new Set(
  Object.keys(import.meta.glob('/public/car-images/**/*.png')).map((p) => p.replace('/public/', '')),
)

describe('car list', () => {
  it('has a unique, readable id for every car', () => {
    const ids = CARS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('gives every car a manufacturer, a name and a known drivetrain', () => {
    for (const c of CARS) {
      expect(c.manufacturer, c.id).not.toBe('')
      expect(c.name, c.id).not.toBe('')
      expect(DRIVETRAINS, c.id).toContain(c.drivetrain)
    }
  })

  it('keeps picture paths under car-images/ and never shares one between cars', () => {
    const paths = CARS.flatMap((c) => (c.image ? [c.image] : []))
    for (const p of paths) expect(p).toMatch(/^car-images\/[a-z0-9-]+\/[a-z0-9-]+\.(png|jpg|webp)$/)
    expect(new Set(paths).size).toBe(paths.length)
  })

  // The pictures are git-ignored (D11), so this only runs on a machine that has them.
  it.runIf(PICTURE_PATHS.size > 0)('has the file for every picture path', () => {
    expect(CARS.filter((c) => c.image && !PICTURE_PATHS.has(c.image)).map((c) => c.id)).toEqual([])
  })
})
