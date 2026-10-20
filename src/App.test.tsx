import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('unlocks the suspension inputs only for Fully Customised Suspension', async () => {
    const user = userEvent.setup()
    render(<App />)
    const toe = () => screen.getAllByLabelText('Toe Angle')[0]
    expect(toe()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Suspension'), 'Fully Customised Suspension')
    expect(toe()).toBeEnabled()
  })

  it('follows the preview drivetrain for the differential', async () => {
    const user = userEvent.setup()
    render(<App />)
    const frontInitial = () => screen.getAllByLabelText('Initial Torque')[0]
    await user.selectOptions(screen.getByLabelText('Drivetrain (preview)'), 'FR')
    expect(frontInitial()).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Drivetrain (preview)'), '4WD')
    expect(frontInitial()).toBeEnabled()
  })
})
