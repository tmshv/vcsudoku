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

React 19, TypeScript 5.9, Vite 7, Valtio 2 (with valtio-history for undo/redo), Vitest 4 with jsdom environment, @testing-library/react for hook testing. Node 24 (specified in `mise.toml`).

## Architecture

This is a browser-based Sudoku game. All source code is in `src/`.

### Store layer

- **`store/gameStore.ts`** — Two Valtio proxies: `gameData` (proxyWithHistory wrapping board + notes, enables undo/redo) and `gameUI` (plain proxy for solution, initial, selected, difficulty, elapsed, notesMode). All game mutations and derived computations (`computeErrors`, `computeWon`) live here.
- **`store/jumpStore.ts`** — Jump mode state machine (Valtio proxy). Space activates, two digits (row, col) jump to a cell, Escape cancels. Provides `getOverlay` for cell coordinate labels.

### Hooks

- **`useGame.ts`** — Thin facade over the store. Subscribes to both proxies via `useSnapshot`, derives `errors` and `won` with `useMemo`, manages the timer interval, and re-exports store actions.
- **`useKeyboard.ts`** — Centralized `keydown` handler: undo/redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y), digit placement, arrow keys, vim h/j/k/l movement, Shift+Arrow / H/J/K/L block-level jumps, N notes toggle, Space jump mode. Delegates to `jumpStore.handleKey` first.

### Pure logic

- **`sudoku.ts`** — Board validation (`isValidPlacement`), backtracking solver (`solve`), puzzle generation (`generatePuzzle`) with difficulty-based cell removal counts (easy=38, medium=46, hard=53 cells removed).

### Components

- **`App.tsx`** — Root component. Composes the toolbar (difficulty buttons, timer), Board, NumberPad, StatusBar, and win overlay.
- **`components/Board.tsx`** — Renders 9x9 grid, computes per-cell visual states (selected, highlighted row/col/box, same-number highlighting, errors). Accepts an `overlay` render prop for jump mode labels.
- **`components/Cell.tsx`** — Renders a single cell: value, notes (3x3 grid of candidate digits), overlay label, or empty.
- **`components/NumberPad.tsx`** — Number buttons 1-9 (disabled when all 9 instances placed), Notes toggle, Erase button, Undo/Redo buttons.
- **`components/StatusBar.tsx`** — Contextual shortcut hints. Shows jump mode prompts when active, default navigation shortcuts otherwise.

### Styles

- **`index.css`** — All styles in a single file.

## Style

- Markdown tables must have columns aligned with spaces so that pipe characters form straight vertical lines.
- In markdown code blocks, inline comments must be aligned vertically with spaces.

## Testing Patterns

- `sudoku.test.ts` tests pure logic directly.
- `useGame.test.ts` mocks `generatePuzzle` from `./sudoku` via `vi.mock` to use a deterministic board, then tests the hook with `renderHook` from @testing-library/react. Uses `vi.useFakeTimers()` for timer tests.
- `useGame.undo.test.ts` tests undo/redo through the hook with the same mock setup.
- `store/gameStore.test.ts` tests store mutations and undo/redo directly against the Valtio proxies (no React rendering).
- `store/jumpStore.test.ts` tests the jump mode state machine: activation, digit feeding, cell selection, and cancellation.

### Valtio testing notes

- `useSnapshot` uses microtask-based subscription -- tests need `await act(async () => ...)` instead of sync `act()`.
- `vi.mock` is hoisted -- use `vi.hoisted()` to define test data (like SOLUTION) that the mock factory needs.
- Store tests can read/mutate proxies directly; reset state in `beforeEach` by calling `newGame()`.
