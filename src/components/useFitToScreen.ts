import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import { BASE_PX, COLUMN_REM, MAX_SCALE, MIN_FIT_WIDTH, chooseFit } from './fit'
import type { Fit } from './fit'

// The check moves the scale in 3% steps, at most this many times, so it can't loop forever.
const STEP = 0.03
const MAX_STEPS = 25

// Makes the form fit the screen with no scrolling on a tablet or larger (#20).
//
// Every size in index.css is in rem, so changing the root font size scales the whole page. This
// hook does that, together with the column count:
// 1. Reset to normal size, put the form in one column of the minimum width, and measure its height.
// 2. Let chooseFit pick the column count and scale from that and the screen size.
// 3. Apply them, then check the real page. While it still scrolls, shrink 3% and check again;
//    if it already fits, grow 3% at a time until the next step would scroll, so no room is wasted.
//
// It runs before the browser paints (useLayoutEffect) so there is no flash of the wrong size, and
// again on resize and once the font has loaded, because the font changes how tall the rows are.
export function useFitToScreen(formRef: RefObject<HTMLFormElement | null>) {
  useLayoutEffect(() => {
    const form = formRef.current
    if (!form) return
    const root = document.documentElement

    const apply = (fit: Fit) => {
      form.style.setProperty('--columns', String(fit.columns))
      root.style.fontSize = fit.scale === 1 ? '' : `${BASE_PX * fit.scale}px`
    }
    const overflows = () =>
      root.scrollHeight > window.innerHeight + 1 || root.scrollWidth > window.innerWidth + 1

    function run() {
      // 1. Measure at normal size.
      root.style.fontSize = ''
      form!.style.setProperty('--columns', '1')
      form!.style.width = `${COLUMN_REM}rem`
      const contentHeight = form!.getBoundingClientRect().height
      form!.style.width = ''

      // 2. Choose.
      let fit = chooseFit(window.innerWidth, window.innerHeight, contentHeight)
      apply(fit)

      // 3. Verify: shrink while it scrolls, or, if it already fits, grow while it still fits.
      if (window.innerWidth < MIN_FIT_WIDTH) return
      if (overflows()) {
        for (let i = 0; i < MAX_STEPS && overflows(); i++) {
          fit = { ...fit, scale: fit.scale * (1 - STEP) }
          apply(fit)
        }
        return
      }
      for (let i = 0; i < MAX_STEPS && fit.scale * (1 + STEP) <= MAX_SCALE; i++) {
        const bigger = { ...fit, scale: fit.scale * (1 + STEP) }
        apply(bigger)
        if (overflows()) {
          apply(fit)
          break
        }
        fit = bigger
      }
    }

    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(run)
    }

    run()
    window.addEventListener('resize', schedule)
    void document.fonts?.ready.then(schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      root.style.fontSize = ''
    }
  }, [formRef])
}
