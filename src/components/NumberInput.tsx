import { useState } from 'react'
import { clampValue } from '../tune/rules'
import type { FieldDef } from '../tune/schema'

export type NumberField = Extract<FieldDef, { kind: 'int' | 'decimal' }>

interface Props {
  id: string
  field: NumberField
  value: number | undefined
  disabled?: boolean
  onChange: (value: number | undefined) => void
}

const toText = (value: number | undefined) => (value === undefined ? '' : String(value))

// A text box for a number that lets you type freely and only cleans the value when you finish.
//
// Clamping on every keystroke would make typing "150" into a 0-100 field impossible (the "1"
// is fine, but a clamp mid-way would fight the user), so the raw text lives in local state and
// is turned into a number on blur or Enter. An empty box means "not set" and reports undefined,
// which the parent uses to remove the key from the tune.
export function NumberInput({ id, field, value, disabled, onChange }: Props) {
  // useState is like a Flutter State field: it survives rebuilds, and setText triggers one.
  const [text, setText] = useState(toText(value))
  const [seenValue, setSeenValue] = useState(value)

  // If the parent changes the value (e.g. a tune is loaded), show it instead of our old text.
  // React lets a component set its own state during render for this; it re-renders at once.
  if (value !== seenValue) {
    setSeenValue(value)
    setText(toText(value))
  }

  // Turns the typed text into a clean number, or reverts it if it isn't one.
  //
  // 1. Empty text means unset.
  // 2. Anything clampValue rejects (e.g. "abc") puts the last good value back.
  // 3. Otherwise show the clamped, rounded number so the user sees what was kept.
  function commit() {
    const trimmed = text.trim()
    if (trimmed === '') {
      setText('')
      onChange(undefined)
      return
    }
    const clean = clampValue(field, Number(trimmed))
    if (typeof clean !== 'number') {
      setText(toText(value))
      return
    }
    setText(String(clean))
    onChange(clean)
  }

  const { min, max } = field
  const placeholder =
    min !== undefined && max !== undefined
      ? `${min} to ${max}`
      : min !== undefined
        ? `min ${min}`
        : max !== undefined
          ? `max ${max}`
          : ''
  // The phone number pad has no minus key, so fields that allow negatives get the full keyboard.
  const allowsNegative = (field.min ?? -1) < 0

  return (
    <input
      id={id}
      type="text"
      inputMode={allowsNegative ? undefined : field.kind === 'int' ? 'numeric' : 'decimal'}
      autoComplete="off"
      placeholder={placeholder}
      disabled={disabled}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
    />
  )
}
