# vcsudoku

A Sudoku game that was **vibe coded** into existence. No careful architecture diagrams, no lengthy design docs — just vibes and a backtracking solver.

## What is this?

A fully playable browser-based Sudoku with three difficulty levels, pencil notes, error highlighting, a timer, and a win screen. The entire thing lives in a handful of TypeScript files and one CSS file. It works. Somehow.

## Features

- **Three difficulty levels** — Easy, Medium, Hard (removing 45, 51, or 56 cells respectively, because why not)
- **Pencil notes** — Toggle notes mode (N key) and jot down candidates like a civilized person. While it's on, the Notes button fills in with a checkmark and a `NOTES` badge sits next to the timer, so you always know which mode swallowed your keypress
- **One accent, three strengths** — Select a cell holding a 5 and every other 5 on the board takes the same tint the cursor is sitting on; a 5 pencilled into notes gets that same accent undiluted, as a small circle, because a note is too small for a tint to register. Row, column, and box get a lighter step of the one color. Nothing on the board is highlighted in a second hue, and the cursor is told apart by its ring rather than by a color of its own
- **Auto-cleanup** — Notes get cleaned up automatically when you place a number, because the code is more organized than you are
- **Error highlighting** — Checks your numbers against the actual solution, so there's no fooling it
- **Mistake counter (optional)** — Off by default. Turn on *Count mistakes* under the ⚙ gear to get a running `✕ N` tally in the header. Each wrong digit counts once; undo doesn't take it back, and a new game resets it
- **Timer** — So you know exactly how long you spent procrastinating
- **Keyboard navigation** — Arrow keys, vim h/j/k/l, and Shift+Arrow / H/J/K/L for block-level jumps
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y), because mistakes happen
- **Hint walkthroughs** — Press `v` or click Hint to explore a logical move step by step, with highlighted rows, columns, boxes, supporting digits, and crossed-out candidates. Supports singles, pointing/claiming, naked/hidden pairs and triples, and X-Wing. Apply the conclusion as an undoable move, or close with Esc. Available on touch screens too; answer reveals are explicit and labeled. See [how hints work](docs/hints.md).
- **Jump mode** — Press Space, then two digits (row, col) to teleport to any cell
- **ASCII export** — Press `p` to copy the current board as a bordered ASCII grid to the clipboard
- **Status bar** — Contextual shortcut hints so you don't have to memorize everything
- **Win detection** — Fill it all in correctly and get a satisfying overlay
- **Completion animations** — Blue flash on cells when a row, column, or box is completed; matching blue flash on the number pad button when all 9 of a digit are placed
- **Dark / Light / System theme** — Click the ⚙ gear icon (top-right) to switch themes; system mode follows your OS preference and persists across sessions
- **Current difficulty on screen** — The gear button in the header shows what you're playing (`Easy`, `Master`, or `Custom · 42` during a custom game), and clicking it opens the settings
- **Settings persist** — Theme, difficulty, mistake counting, and your custom cells-removed value are saved to localStorage; reopening the game deals a fresh puzzle at the difficulty you last played
- **Readable at a glance** — Board digits are 60% of the cell, and every text color in both themes clears WCAG AA contrast against the backgrounds it actually lands on
- **Disabled still means readable** — Buttons you can't press (a finished digit, Redo with nothing to redo) drop to a recessed surface with dimmed type instead of fading to a 30% ghost; a completed digit keeps its accent fill and full-strength label, because finishing one is an achievement, not a dead control

## Tech Stack

React 19 + TypeScript 7 + Vite 8 + Valtio 2 for state management (with valtio-history for undo/redo). Tested with Vitest and @testing-library/react. No CSS framework. A thin `useGame` hook facades two Valtio proxies, and somehow it all holds together.

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
    settingsStore.ts  — Persisted settings (theme, difficulty, custom cells) in localStorage
  components/
    Board.tsx         — 9x9 grid with highlighting and overlay support
    Cell.tsx          — A single cell (values, notes, overlays, or emptiness)
    NumberPad.tsx     — Number buttons, notes toggle, erase, undo/redo
    SettingsPanel.tsx — Gear button showing current difficulty + settings panel
    StatusBar.tsx     — Contextual shortcut hints
  index.css           — All the styles, one file, no regrets
```

## Installing as an app

The game is a Progressive Web App (PWA) and can be installed on your device for offline play and a native app feel.

**iOS (Safari)**

1. Open the game URL in Safari
2. Tap the Share button (rectangle with an arrow pointing up)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** — the Sudoku icon will appear on your home screen

**Android (Chrome)**

1. Open the game URL in Chrome
2. Tap the three-dot menu in the top right
3. Tap **Add to Home Screen** (or **Install app**)
4. Tap **Add** — the icon will appear on your home screen

Once installed, the app launches without browser chrome and works fully offline.

## License

[MIT](LICENSE)
