import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FIELD_BY_KEY } from '../tune/schema'
import { NumberInput } from './NumberInput'
import type { NumberField } from './NumberInput'

// Looks up a schema field and narrows it to a number field, so a typo fails loudly.
function numberField(key: string): NumberField {
  const field = FIELD_BY_KEY[key]
  if (field?.kind !== 'int' && field?.kind !== 'decimal') throw new Error(`${key} is not a number field`)
  return field
}

// Renders the input with a spy for onChange; `value` stays fixed, like a parent that hasn't re-rendered.
function setup(key: string, value?: number, disabled = false) {
  const onChange = vi.fn()
  const user = userEvent.setup()
  render(<NumberInput id="n" field={numberField(key)} value={value} disabled={disabled} onChange={onChange} />)
  return { onChange, user, input: screen.getByRole<HTMLInputElement>('textbox') }
}

describe('NumberInput', () => {
  it('lets you type freely without reporting until you finish', async () => {
    const { onChange, user, input } = setup('ecuOutput')
    await user.type(input, '150')
    expect(input).toHaveValue('150')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clamps to the field range on blur and shows the clamped number', async () => {
    const { onChange, user, input } = setup('ecuOutput')
    await user.type(input, '150')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith(100)
    expect(input).toHaveValue('100')
  })

  it('commits on Enter too', async () => {
    const { onChange, user, input } = setup('ecuOutput')
    await user.type(input, '40{Enter}')
    expect(onChange).toHaveBeenCalledWith(40)
  })

  it('reports an emptied box as unset (undefined)', async () => {
    const { onChange, user, input } = setup('ecuOutput', 50)
    await user.clear(input)
    await user.tab()
    expect(onChange).toHaveBeenCalledWith(undefined)
    expect(input).toHaveValue('')
  })

  it('rounds decimal fields to their decimal places', async () => {
    const { onChange, user, input } = setup('maxTorque') // 1 decimal place
    await user.type(input, '12.34')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith(12.3)
    expect(input).toHaveValue('12.3')
  })

  it('rounds integer fields to whole numbers', async () => {
    const { onChange, user, input } = setup('ecuOutput')
    await user.type(input, '12.6')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith(13)
  })

  it('allows negative numbers where the field allows them', async () => {
    const { onChange, user, input } = setup('ballastPosition') // -50 to 50
    await user.type(input, '-20')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith(-20)
  })

  it('puts the last good value back when the text is not a number', async () => {
    const { onChange, user, input } = setup('ecuOutput', 50)
    await user.clear(input)
    await user.type(input, 'abc')
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('50')
  })
})
