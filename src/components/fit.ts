// Chooses how many columns, and how big, make the whole form fit the screen without scrolling.
//
// Pure maths with no DOM, so it is easy to test. useFitToScreen.ts measures the page, calls this,
// and applies the answer. All sizes here are at the normal 16px root size (a "scale" of 1).

// Below this width (phones) the form stays one column at normal size and scrolls (#20).
export const MIN_FIT_WIDTH = 768

export const BASE_PX = 16
// The narrowest a column can be at scale 1: a label, plus a Front and a Rear box.
export const COLUMN_REM = 21
export const GAP_REM = 1
// Space around the form: left and right padding each, and the Back button row plus top and bottom
// padding together.
export const PAGE_PAD_X_REM = 1
export const PAGE_PAD_Y_REM = 4.5
// Columns are balanced by the browser, not perfectly, so leave room for the tallest being a bit taller.
const BALANCE_SLACK = 1.12
export const MAX_SCALE = 1.3
const MAX_COLUMNS = 6

export interface Fit {
  columns: number
  scale: number
}

// Tries each column count and keeps the one that allows the biggest scale.
//
// `contentHeight` is the height in px of all panels stacked in one column of COLUMN_REM at
// scale 1. For n columns that height is split n ways, so each column is about contentHeight / n.
// The scale is limited by whichever runs out first: the screen width or the screen height.
export function chooseFit(width: number, height: number, contentHeight: number): Fit {
  if (width < MIN_FIT_WIDTH || contentHeight <= 0) return { columns: 1, scale: 1 }

  let best: Fit = { columns: 1, scale: 0 }
  for (let columns = 1; columns <= MAX_COLUMNS; columns++) {
    const neededWidth = BASE_PX * (columns * COLUMN_REM + (columns - 1) * GAP_REM + 2 * PAGE_PAD_X_REM)
    const neededHeight = BASE_PX * PAGE_PAD_Y_REM + (contentHeight / columns) * BALANCE_SLACK
    const scale = Math.min(width / neededWidth, height / neededHeight, MAX_SCALE)
    if (scale > best.scale) best = { columns, scale }
  }
  return best
}
