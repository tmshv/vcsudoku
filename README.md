# vcsudoku

A Sudoku game that was **vibe coded** into existence. No careful architecture diagrams, no lengthy design docs — just vibes and a backtracking solver.

## What is this?

A fully playable browser-based Sudoku with three difficulty levels, pencil notes, error highlighting, a timer, and a win screen. The entire thing lives in a handful of TypeScript files and one CSS file. It works. Somehow.

## Features

- **Three difficulty levels** — Easy, Medium, Hard (removing 45, 51, or 56 cells respectively, because why not)
- **Pencil notes** — Toggle notes mode (N key) and jot down candidates like a civilized person
- **Auto-cleanup** — Notes get cleaned up automatically when you place a number, because the code is more organized than you are
- **Error highlighting** — Checks your numbers against the actual solution, so there's no fooling it
- **Timer** — So you know exactly how long you spent procrastinating
- **Keyboard navigation** — Arrow keys, vim h/j/k/l, and Shift+Arrow / H/J/K/L for block-level jumps
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y), because mistakes happen
- **Jump mode** — Press Space, then two digits (row, col) to teleport to any cell
- **Status bar** — Contextual shortcut hints so you don't have to memorize everything
- **Win detection** — Fill it all in correctly and get a satisfying overlay

## Tech Stack

React 19 + TypeScript 5.9 + Vite 7 + Valtio 2 for state management (with valtio-history for undo/redo). Tested with Vitest and @testing-library/react. No CSS framework. A thin `useGame` hook facades two Valtio proxies, and somehow it all holds together.

## Getting Started

```sh
npm install
npm run dev
```

## Scripts

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server                 |
| `npm run build` | Type-check and build for production  |
| `npm run lint`  | Lint the code                        |
| `npm run test`  | Run the test suite                   |

## Project Structure

```
src/
  sudoku.ts           — Pure logic: validation, solver, puzzle generation
  useGame.ts          — Thin facade over the Valtio store
  useKeyboard.ts      — Centralized keyboard handler (vim keys, undo/redo, jump mode)
  App.tsx             — Puts the pieces together
  store/
    gameStore.ts      — Two Valtio proxies: board data (with undo/redo) and UI state
    jumpStore.ts      — Jump mode state machine
  components/
    Board.tsx         — 9x9 grid with highlighting and overlay support
    Cell.tsx          — A single cell (values, notes, overlays, or emptiness)
    NumberPad.tsx     — Number buttons, notes toggle, erase, undo/redo
    StatusBar.tsx     — Contextual shortcut hints
  index.css           — All the styles, one file, no regrets
```

## License

[MIT](LICENSE)
