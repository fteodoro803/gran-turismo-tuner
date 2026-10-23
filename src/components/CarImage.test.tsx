import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { carImageUrl } from '../data/car-images'
import { CarImage } from './CarImage'

const IMAGE = 'car-images/ford/gt-race-car-2018.png'

describe('CarImage', () => {
  it('points at the picture path it is given', () => {
    const { container } = render(<CarImage image={IMAGE} />)
    expect(container.querySelector('img')).toHaveAttribute('src', carImageUrl(IMAGE))
    expect(carImageUrl(IMAGE)).toMatch(/car-images\/ford\/gt-race-car-2018\.png$/)
  })

  it('renders nothing for a car with no picture', () => {
    const { container } = render(<CarImage />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the file is missing', () => {
    const { container } = render(<CarImage image="car-images/nobody/no-such-car.png" />)
    fireEvent.error(container.querySelector('img')!)
    expect(container).toBeEmptyDOMElement()
  })
})
