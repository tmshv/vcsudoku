# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint` (runs `biome lint .`)
- **Format check:** `npm run format:check` (runs `biome format .`)
- **Lint + format:** `npm run check` (runs `biome check .`)
- **Run all tests:** `npm run test` (runs `vitest run`)
- **Run a single test file:** `npx vitest run src/sudoku.test.ts`
- **Run tests matching a pattern:** `npx vitest run -t "pattern"`

## Tech Stack

React 19, TypeScript 5.9, Vite 7, Vitest 4 with jsdom environment, @testing-library/react for hook testing. Node 24 (specified in `mise.toml`).

## Architecture

This is a browser-based Sudoku game. All source code is in `src/`.

- **`sudoku.ts`** — Pure logic: board validation (`isValidPlacement`), backtracking solver (`solve`), puzzle generation (`generatePuzzle`) with difficulty-based cell removal counts (easy=45, medium=51, hard=56 cells removed).
- **`useGame.ts`** — Single React hook (`useGame`) that owns all game state: board, solution, selection, errors (checked against solution, not constraint-based), notes with auto-cleanup on placement, timer, and win detection. All game actions (placeNumber, clearCell, toggleNote, moveSelection, newGame) are exposed from this hook.
- **`App.tsx`** — Root component. Composes the toolbar (difficulty buttons, timer), Board, NumberPad, and win overlay. Routes number pad input through notes mode toggle.
- **`components/Board.tsx`** — Renders 9x9 grid, computes per-cell visual states (selected, highlighted row/col/box, same-number highlighting, errors).
- **`components/Cell.tsx`** — Renders a single cell: value, notes (3x3 grid of candidate digits), or empty.
- **`components/NumberPad.tsx`** — Number buttons 1-9 (disabled when all 9 instances placed), Notes toggle, Erase button.
- **`index.css`** — All styles in a single file.

## Style

- Markdown tables must have columns aligned with spaces so that pipe characters form straight vertical lines.
- In markdown code blocks, inline comments must be aligned vertically with spaces.

## Testing Patterns

- `sudoku.test.ts` tests pure logic directly.
- `useGame.test.ts` mocks `generatePuzzle` from `./sudoku` via `vi.mock` to use a deterministic board, then tests the hook with `renderHook` from @testing-library/react. Uses `vi.useFakeTimers()` for timer tests.
