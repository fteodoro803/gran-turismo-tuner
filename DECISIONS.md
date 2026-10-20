# DECISIONS.md

The log of decisions made about this project, and why. Open questions live on GitHub as issues labelled `decision`, where anyone can weigh in and the owner makes the call. Once a call is made, it's recorded here.

## What belongs here

- **This file**: decisions that were made, with the reasoning, so later work doesn't reopen them by accident.
- **Not here**:
  - An open question → a `decision` issue.
  - Work a decision creates → its own issue (`known-issue`, `deferred` or `bug`).
  - A convention a decision creates → `CLAUDE.md`, linked from the row.

---

## Decided

| # | Decision | Documented in |
|---|---|---|
| D1 | **Text only for the first release: no car photos and no manufacturer logos.** Car images and logos are Sony's and the manufacturers' property, and the website terms forbid copying site content. Car thumbnails are deferred and would come from the owner's own game screenshots if added. | `PROJECT_CONTEXT.md` |
| D2 | **A tune is stored in the link itself, after the `#`: compact JSON with defaults left out, base64url, with a version number.** No backend. Static hosting can't serve path-style routes, and a hash is never sent to a server. | `src/tune/` (codec in D4) |
| D3 | **A link stores each number and its unit as the author typed it; the viewer's app converts for display.** No rounding drift in the shared link. Rounding rules for the display are still to research. | `PROJECT_CONTEXT.md` |
| D4 | **Stack: React 19 + Vite + TypeScript, with Vitest for tests.** Form-heavy UI with linked fields, and the portfolio can build it with `npm ci && npm run build`. | `CLAUDE.md` |
| D5 | **A shared tune opens read-only with an "Edit a copy" button.** Saving makes a new link. | `PROJECT_CONTEXT.md` |
| D6 | **The tune schema is data, and types, defaults and rules are derived from it. An empty number is unset (left out of the link). A value for a locked field is kept while editing and dropped when the tune is normalised.** One place to add a field. A shared tune can be partly filled in. | `src/tune/schema.ts`, `CLAUDE.md` |
| D7 | **Drivetrain rules:** front differential inputs are enabled for FF, 4WD and Other, rear for everything except FF, and the center differential and torque split only for 4WD. Suspension inputs are locked unless the suspension is Fully Customised. The UI section is named Turbocharger/Supercharger. | `src/tune/rules.ts` |
| D8 | **Car data comes from the owner's own screenshots of the official list, written to a flat `cars.json` with our own readable slug ids and no Sony id field.** An id is never changed once it has appeared in a shared link. No scraping. | `CLAUDE.md` |

---

## How to use this file

- **Record** a decision as the next `D#`: bold the one-line decision, put the reasoning after it, and note "(from #N)" if it came from a `decision` issue. Fill "Documented in" with the file(s) where the rule now lives.
- **Close the issue** it came from with a comment pointing here, and unblock anything that said "Blocked by" it.
- **Never renumber.** Gaps are fine; other docs cross-reference `D#`.
- **Follow-ups** to a decision get their own row, labelled `D# (follow-up)`, rather than an edit that changes what the original said.
- Companion docs: `PROJECT_CONTEXT.md`, `CLAUDE.md`, and the repo's issues.
