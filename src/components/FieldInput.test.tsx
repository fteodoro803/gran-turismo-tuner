import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defaultTune } from '../tune/defaults'
import { FIELD_BY_KEY } from '../tune/schema'
import type { Tune } from '../tune/types'
import { FieldInput } from './FieldInput'

function renderField(key: string, tune: Tune = defaultTune()) {
  render(<FieldInput field={FIELD_BY_KEY[key]} tune={tune} onChange={vi.fn()} />)
}

describe('FieldInput', () => {
  it('disables a field the rules switch off', () => {
    // Handbrake is on Normal, so Handbrake Torque is locked.
    renderField('handbrakeTorque')
    expect(screen.getByLabelText('Handbrake Torque')).toBeDisabled()
  })

  it('enables the same field once the rule is satisfied', () => {
    renderField('handbrakeTorque', { ...defaultTune(), handbrake: 'Hydraulic Handbrake' })
    expect(screen.getByLabelText('Handbrake Torque')).toBeEnabled()
  })

  it('renders a toggle as a checkbox and a dropdown as a select', () => {
    renderField('bodyKit')
    expect(screen.getByRole('checkbox', { name: 'Body Kit' })).not.toBeChecked()
    renderField('tiresFront')
    expect(screen.getByRole('combobox', { name: 'Front' })).toHaveValue('Comfort Hard')
  })

  it('renders nothing for fields that wait on issue #13', () => {
    const { container } = render(
      <FieldInput field={FIELD_BY_KEY.torqueSplitFront} tune={defaultTune()} onChange={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
