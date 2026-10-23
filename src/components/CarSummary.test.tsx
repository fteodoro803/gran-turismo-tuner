import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CARS } from '../data/cars'
import { CarSummary } from './CarSummary'

describe('CarSummary', () => {
  it('shows the manufacturer, car and drivetrain on their own rows', () => {
    const car = CARS[0]
    render(<CarSummary choice={{ car }} onChangeCar={() => {}} />)
    expect(screen.getByText('Manufacturer').nextSibling).toHaveTextContent(car.manufacturer)
    expect(screen.getByText('Car').nextSibling).toHaveTextContent(car.name)
    expect(screen.getByText('Drivetrain').nextSibling).toHaveTextContent(car.drivetrain)
  })
})
