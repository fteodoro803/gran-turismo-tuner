# gran-turismo-tuner

A small web app for sharing Gran Turismo 7 tunes as links. Pick a car, fill in the tune, and copy the URL. Anyone who opens it sees the same car and values in the same editable form.

There is no backend and no account: the tune lives in the link, after the `#`. It is meant to replace screenshots and spreadsheets in GT7 communities.

Not affiliated with Sony or Polyphony Digital.

## Run it locally

Developed on Node 24 (Vite 8 needs 20.19 or newer).

```bash
npm install
npm run dev
```

Before a change counts as done, all three of these must pass:

```bash
npm run lint
npm run build
npm test
```

## Stack

TypeScript, React 19, Vite, Vitest with Testing Library, and oxlint. The build is plain static files in `dist/`.

## Where things are

| Path | What lives there |
|---|---|
| `src/tune/` | The tune model. `schema.ts` is the single source of truth for fields, defaults and rules, and `codec.ts` turns a tune into a share link and back. |
| `src/data/` | The car list (`cars.json`) and the code that reads it. |
| `src/components/` | The car picker, the tuning form and the share button. |
| `docs/reference/` | Reference screenshots of the game's tuning screens, for checking layout only. They are not used by the app. |

## Part of the portfolio Lab

This app runs as a Lab tool on [fteodoro803/portfolio](https://github.com/fteodoro803/portfolio), served from `/lab/<id>/`. That is why asset paths are relative (`base: './'` in `vite.config.ts`) and why the first page has a "← Back to Projects" link.

The portfolio clones this repo and runs `npm ci && npm run build`, then publishes `dist/`. It does not rebuild when this repo changes, so after each release run its deploy workflow:

```bash
gh workflow run deploy.yml --repo fteodoro803/portfolio
```

## Car pictures

The app ships text only: no car photos or manufacturer logos, because they belong to Sony and the manufacturers. For local design previews, pictures can be placed in the git-ignored `public/car-images/`. Never commit them, and never deploy a `dist/` built while they are there. The reasoning is in `DECISIONS.md` (D1 and D11).

## More

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md): what the project is, how it started and what comes next.
- [`DECISIONS.md`](DECISIONS.md): the decisions made, and why.
- [`CLAUDE.md`](CLAUDE.md): conventions and standing rules.
- Open work is tracked in [GitHub Issues](https://github.com/fteodoro803/gran-turismo-tuner/issues).
