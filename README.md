# vcsudoku

A Sudoku game that was **vibe coded** into existence. No careful architecture diagrams, no lengthy design docs — just vibes and a backtracking solver.

## What is this?

A fully playable browser-based Sudoku with three difficulty levels, pencil notes, error highlighting, a timer, and a win screen. The entire thing lives in a handful of TypeScript files and one CSS file. It works. Somehow.

## Features

- **Three difficulty levels** — Easy, Medium, Hard (removing 45, 51, or 56 cells respectively, because why not)
- **Pencil notes** — Toggle notes mode and jot down candidates like a civilized person
- **Auto-cleanup** — Notes get cleaned up automatically when you place a number, because the code is more organized than you are
- **Error highlighting** — Checks your numbers against the actual solution, so there's no fooling it
- **Timer** — So you know exactly how long you spent procrastinating
- **Keyboard navigation** — Arrow keys work, for those who refuse to use a mouse
- **Win detection** — Fill it all in correctly and get a satisfying overlay

## Tech Stack

React 19 + TypeScript 5.9 + Vite 7. Tested with Vitest and @testing-library/react. That's it. No state management library. No CSS framework. Just a single `useGame` hook holding everything together with sheer willpower.

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
  sudoku.ts         — Pure logic: validation, solver, puzzle generation
  useGame.ts        — The one hook to rule them all
  App.tsx           — Puts the pieces together
  components/
    Board.tsx       — 9x9 grid with highlighting
    Cell.tsx        — A single cell (values, notes, or emptiness)
    NumberPad.tsx   — Number buttons, notes toggle, erase
  index.css         — All the styles, one file, no regrets
```

## License

[MIT](LICENSE)
