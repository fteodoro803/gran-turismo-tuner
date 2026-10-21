# PROJECT_CONTEXT.md

> Background context for this project. Read this before making changes. It explains what the project is, how it evolved, and what's known to be incomplete. Update this file as things get fixed or scope changes.

## What this is

A static web app for sharing Gran Turismo 7 tunes as links. You pick a car, fill in a tune, and share a URL. Anyone who opens it sees the tune in a clean page, in their own units. Meant to replace screenshots and spreadsheets in GT7 communities.

- Free hobby tool, used by a few people in GT7 communities. Not affiliated with Sony or Polyphony Digital.
- No backend: the tune lives in the link, after the `#`.
- Runs as a Lab tool on the owner's portfolio (`fteodoro803/portfolio`), served from `/lab/<id>/`.
- Text only for now: no car photos and no manufacturer logos (D1).

**Stack:** TypeScript, React 19, Vite, Vitest, Testing Library, oxlint. Plain static output in `dist/`.

## Origin and current scope

Started in October 2026 from the idea that GT7 tune sharing by screenshot and spreadsheet is slow to update and hard to search. The first release covers a car picker, the 17 tuning sections, unit conversion and share links. The build order is D0 to D10:

- **Done:** D1 (scaffold) and D2 (tune data model).
- **Next:** D3 (car data from screenshots), then D4 (link codec), D5 (car picker), D6 and D7 (form), D8 (units), D9 (view and share), D10 (ship to the portfolio).

Portfolio rules the build must follow: relative asset paths (`base: './'`), an `index.html` in the output folder, a "← Back to Lab" link, no dependency on the portfolio's CSS, and no backend. The portfolio does not rebuild when this repo changes, so run its deploy workflow after each release.

## Known issues

Settled-but-unbuilt work lives on GitHub as issues labelled `known-issue`. Open questions are `decision` issues, bugs are `bug` issues, and changes parked mid-task are `deferred` issues.

## Future directions (deferred, not scoped, not started)

Ideas that are wanted or plausible but have no design and no owner yet. Promote one to a `known-issue` issue (settled and planned), a `deferred` issue (concrete and waiting on a trigger), or a `decision` issue (needs a call) when it becomes real.

### Car thumbnails

Optional car images for the picker and view. Deferred because the images are Sony's. If added, they would come from the owner's own game screenshots, loaded through one image function so they can be swapped or removed.

### Public tune gallery or search

Needs a backend, which the static-site design rules out for now.

## Learning mode

Pieces marked new or learning in `~/.claude/learning/familiarity.md`, where Claude slows down and explains from the anchor:

- **Vite**: new, builds on Meteor.

## How to use this file

- Treat this as background, not a task list. When asked to explore, map, or document the repo, use this file to understand intent. Don't treat it as a prompt to start fixing things.
- When behaviour or scope changes, update this file so it stays accurate.
- Companion docs: `DECISIONS.md`, `CLAUDE.md` (conventions and standing rules), and the repo's issues.
- Docs page: not published (no architecture map or learnings file yet). Plan and recap pages stay private and are never shared. Docs live in the repo as markdown.
- Plan page: https://claude.ai/artifact/6j5Bbcmk6UWC5o6QaeiJmG (private)
