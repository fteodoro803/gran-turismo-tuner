import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { CARS } from './data/cars'
import { SECTIONS } from './tune/schema'
import type { Drivetrain } from './tune/types'

type User = ReturnType<typeof userEvent.setup>

// The first real car with the given drivetrain.
const carWith = (drivetrain: Drivetrain) => CARS.find((c) => c.drivetrain === drivetrain)!

// Picks a car in the picker, without pressing Enter.
async function pick(user: User, car: (typeof CARS)[number]) {
  await user.selectOptions(screen.getByLabelText('Manufacturer'), car.manufacturer)
  await user.selectOptions(screen.getByLabelText('Model'), String(car.id))
}

// Gets past the first page with a car that has the given drivetrain.
async function enter(user: User, drivetrain: Drivetrain) {
  await pick(user, carWith(drivetrain))
  await user.click(screen.getByRole('button', { name: 'Enter' }))
}

describe('App', () => {
  it('opens on the car picker, with the title and disclaimer', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'GT7 Tune Sharing' })).toBeInTheDocument()
    expect(screen.getByText(/not affiliated with Sony/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to Lab/ })).toBeInTheDocument()
    expect(screen.queryByLabelText('Toe Angle')).not.toBeInTheDocument()
  })

  it('unlocks the suspension inputs only for Fully Customised Suspension', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, 'FR')
    const toe = () => screen.getAllByLabelText('Toe Angle')[0]
    expect(toe()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Suspension'), 'Fully Customised Suspension')
    expect(toe()).toBeEnabled()
  })

  it('follows the chosen drivetrain for the differential', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, 'FR')
    const frontInitial = () => screen.getAllByLabelText('Initial Torque')[0]
    expect(frontInitial()).toBeDisabled()

    // Change car goes back to the picker, which remembers the last choice.
    await user.click(screen.getByRole('button', { name: 'Change car' }))
    expect(screen.getByLabelText('Manufacturer')).toHaveValue(carWith('FR').manufacturer)
    await pick(user, carWith('4WD'))
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(frontInitial()).toBeEnabled()
  })

  it('has a Back button that returns to the car picker', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'GT7 Tune Sharing' })).toBeInTheDocument()
    expect(screen.getByLabelText('Manufacturer')).toHaveValue(carWith('4WD').manufacturer)
    expect(screen.getByLabelText('Model')).toHaveValue(String(carWith('4WD').id))
  })

  it('keeps the tune when you change the car', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    await user.selectOptions(screen.getByLabelText('Suspension'), 'Fully Customised Suspension')
    await user.click(screen.getByRole('button', { name: 'Change car' }))
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(screen.getByLabelText('Suspension')).toHaveValue('Fully Customised Suspension')
  })

  it('shows every section on one page, with no tabs and no title bar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(SECTIONS.length)
  })

  it('shows the car and drivetrain in the General panel', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByLabelText('Manufacturer'), 'Ford')
    await user.selectOptions(screen.getByLabelText('Model'), "Ford GT Race Car '18")
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(screen.getByText("Ford GT Race Car '18")).toBeInTheDocument()
    expect(screen.getByText('MR')).toBeInTheDocument()
  })

  it('puts Tires directly above Suspension in one block', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    const stack = screen.getByRole('heading', { name: 'Tires' }).closest('.stack')
    expect(stack).not.toBeNull()
    const titles = [...stack!.querySelectorAll('h2')].map((h) => h.textContent)
    expect(titles).toEqual(['Tires', 'Suspension'])
  })

  it('pairs Front and Rear suspension inputs in one row, each reachable by label', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    const toes = screen.getAllByLabelText('Toe Angle')
    expect(toes).toHaveLength(2)
    expect(toes[0].closest('.pair-row')).toBe(toes[1].closest('.pair-row'))
  })
})
