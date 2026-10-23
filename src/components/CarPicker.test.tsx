import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CarPicker } from './CarPicker'
import type { Car } from './CarPicker'

const CARS: Car[] = [
  { id: 'a-one', manufacturer: 'Alpha', name: 'One', drivetrain: 'FR' },
  { id: 'a-two', manufacturer: 'Alpha', name: 'Two', drivetrain: '4WD' },
  { id: 'b-one', manufacturer: 'Beta', name: 'Uno', drivetrain: 'MR' },
]

const enter = () => screen.getByRole('button', { name: 'Enter' })

describe('CarPicker', () => {
  it('keeps Enter disabled until a car is chosen', async () => {
    const user = userEvent.setup()
    render(<CarPicker cars={CARS} onEnter={vi.fn()} />)
    expect(enter()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Alpha')
    expect(enter()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Model'), 'Two')
    expect(enter()).toBeEnabled()
  })

  it('lists only the models of the chosen manufacturer, and shows the drivetrain', async () => {
    const user = userEvent.setup()
    render(<CarPicker cars={CARS} onEnter={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Alpha')
    const options = [...screen.getByLabelText('Model').querySelectorAll('option')].map((o) => o.textContent)
    expect(options).toEqual(['Choose…', 'One', 'Two'])
    await user.selectOptions(screen.getByLabelText('Model'), 'Two')
    expect(screen.getByText('4WD')).toBeInTheDocument()
  })

  it('clears the model when the manufacturer changes', async () => {
    const user = userEvent.setup()
    render(<CarPicker cars={CARS} onEnter={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Alpha')
    await user.selectOptions(screen.getByLabelText('Model'), 'One')
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Beta')
    expect(screen.getByLabelText('Model')).toHaveValue('')
    expect(enter()).toBeDisabled()
  })

  it('sends the car and its drivetrain on Enter', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<CarPicker cars={CARS} onEnter={onEnter} />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Beta')
    await user.selectOptions(screen.getByLabelText('Model'), 'Uno')
    await user.click(enter())
    expect(onEnter).toHaveBeenCalledWith({ car: CARS[2], drivetrain: 'MR' })
  })

  it("lets an unlisted car enter with just a drivetrain", async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn()
    render(<CarPicker cars={CARS} onEnter={onEnter} />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), "My car isn't listed")
    expect(enter()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Drivetrain'), 'RR')
    await user.click(enter())
    expect(onEnter).toHaveBeenCalledWith({ drivetrain: 'RR' })
  })

  it("shows a car's picture only if the car has an image", async () => {
    const user = userEvent.setup()
    const withImage: Car[] = [
      { ...CARS[0], image: 'car-images/alpha/one.png' },
      { ...CARS[1] },
    ]
    const { container } = render(<CarPicker cars={withImage} onEnter={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Alpha')
    await user.selectOptions(screen.getByLabelText('Model'), 'One')
    expect(container.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/car-images\/alpha\/one\.png$/))
    await user.selectOptions(screen.getByLabelText('Model'), 'Two')
    expect(container.querySelector('img')).toBeNull()
  })
})
