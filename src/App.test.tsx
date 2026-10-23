import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { SECTIONS } from './tune/schema'

type User = ReturnType<typeof userEvent.setup>

// Gets past the first page the way a person with an unlisted car would.
async function enter(user: User, drivetrain: string) {
  await user.selectOptions(screen.getByLabelText('Manufacturer'), "My car isn't listed")
  await user.selectOptions(screen.getByLabelText('Drivetrain'), drivetrain)
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
    expect(screen.getByLabelText('Drivetrain')).toHaveValue('FR')
    await user.selectOptions(screen.getByLabelText('Drivetrain'), '4WD')
    await user.click(screen.getByRole('button', { name: 'Enter' }))
    expect(frontInitial()).toBeEnabled()
  })

  it('has a Back button that returns to the car picker', async () => {
    const user = userEvent.setup()
    render(<App />)
    await enter(user, '4WD')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'GT7 Tune Sharing' })).toBeInTheDocument()
    expect(screen.getByLabelText('Drivetrain')).toHaveValue('4WD')
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
