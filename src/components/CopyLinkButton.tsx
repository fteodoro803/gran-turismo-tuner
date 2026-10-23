import { useState } from 'react'
import { encode } from '../tune/codec'
import type { Tune } from '../tune/types'
import type { Units } from '../tune/units'
import type { Car } from './CarPicker'

interface Props {
  tune: Tune
  car: Car
  // The units the numbers were typed in, which the link keeps as they are (D3).
  units: Units
}

// A button that copies a share link for the current car and tune (#5).
//
// 1. Build the link: this page's address with the encoded tune after the `#`.
// 2. Copy it to the clipboard and say "Copied" for a moment.
// 3. If the clipboard is unavailable, put the link in the address bar instead, so it can be copied by hand.
export function CopyLinkButton({ tune, car, units }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')

  const copy = async () => {
    const hash = encode({ tune, car, units })
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${hash}`
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch {
      window.location.hash = hash
      setStatus('manual')
    }
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <button type="button" className="button button-quiet" onClick={copy}>
      {status === 'copied' ? 'Copied' : status === 'manual' ? 'Copy it from the address bar' : 'Copy link'}
    </button>
  )
}
