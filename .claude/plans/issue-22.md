# Plan: Hint Mode ("Help Me" feature)

## Context

Players sometimes get stuck and don't know their next move. This feature adds a hint system triggered by pressing `v` or clicking the "Hint" button in the control panel. The hint selects the target cell, shows which digit to place, and explains **why** the move is logically valid (e.g. "Only 7 can go here — all other digits appear in its row, column, or box").

## Approach

Implement pure solving-strategy logic in a new `src/hint.ts` file, a lightweight Valtio store in `src/store/hintStore.ts`, and wire it into the existing UI (NumberPad button, keyboard, StatusBar).

Strategies tried in order (simplest first):
1. **Naked single** — cell has exactly one valid candidate
2. **Hidden single in row** — digit can only go in one cell of a row
3. **Hidden single in column** — digit can only go in one cell of a column
4. **Hidden single in box** — digit can only go in one cell of a 3×3 box
5. **Fallback** — read directly from `solution` and say "try placing X here"

When a hint is active, the board selection moves to the hint cell, and the StatusBar replaces its normal content with a `HINT` label and the explanation text. The hint auto-dismisses on any board mutation.

---

## Tasks

### Task 1: Pure hint logic
- [x] Create `src/hint.ts`
- [x] Export `interface Hint { cell: {row, col}; value: number; strategy: string; explanation: string }`
- [x] `getCandidates(board, row, col): number[]` — wraps `isValidPlacement`
- [x] `findNakedSingle(board)` — find first empty cell with exactly 1 candidate
- [x] `findHiddenSingleInRow(board)` — for each row, find digit that fits only one cell
- [x] `findHiddenSingleInColumn(board)` — same for columns
- [x] `findHiddenSingleInBox(board)` — same for 3×3 boxes
- [x] `getHint(board, solution): Hint | null` — try strategies in order; fallback to solution if all fail

Explanation examples:
- Naked single: `"Only 7 fits here — its row, column, and box each already contain all other digits."`
- Hidden single in row: `"7 can only go in this cell in row 3 — all other empty cells in row 3 conflict with 7."`
- Hidden single in column: `"7 can only go in this cell in column 5 — all other empty cells in column 5 conflict with 7."`
- Hidden single in box: `"7 can only go in this cell in box 4 — all other empty cells in this box conflict with 7."`
- Fallback: `"Try placing 7 here."`

### Task 2: Hint store
- [x] Create `src/store/hintStore.ts`
- [x] `hintState = proxy<{ hint: Hint | null }>({ hint: null })`
- [x] `showHint()` — reads `gameData.value.board` and `gameUI.solution`, calls `getHint()`, sets `hintState.hint`; also calls `selectCell()` to move selection to hint cell; no-op if game is won
- [x] `dismissHint()` — sets `hintState.hint = null`
- [x] Auto-subscribe to `gameData` with Valtio `subscribe` to dismiss hint on any board change (avoids circular imports between `hintStore` and `gameStore`)

### Task 3: NumberPad button
- [x] Add `onHint: () => void` prop to `NumberPadProps` in `src/components/NumberPad.tsx`
- [x] Add "Hint" button in NumberPad (styled with `.hint-btn` — amber tint to stand out)
- [x] Disable when game is won (add `won: boolean` prop)

### Task 4: Keyboard shortcut
- [x] In `src/useKeyboard.ts`, add `else if (e.key === "v")` → `showHint()`

### Task 5: StatusBar display
- [ ] In `src/components/StatusBar.tsx`, read `hintState` via `useSnapshot`
- [ ] When `hintState.hint !== null`, return `{ label: "HINT", text: hint.explanation, shortcuts: [{key: "v", action: "next hint"}, {key: "Esc", action: "dismiss"}] }`
- [ ] Add `Escape` key handling in `useKeyboard.ts` (or `hintStore` subscribe) to dismiss hint on Escape (only when no other mode is active)

### Task 6: App.tsx wiring
- [ ] Pass `onHint={showHint}` and `won={game.won}` to `<NumberPad>`

### Task 7: Styles
- [ ] Add `.hint-btn` CSS to `src/index.css`: amber/yellow tint (e.g. `color: #f57f17; border-color: #f9a825`) similar in size/shape to `.notes-btn`

### Task 8: Tests — pure hint logic
- [ ] Create `src/hint.test.ts`
- [ ] Test `getCandidates`: returns valid numbers for a cell (verify using a known board)
- [ ] Test `findNakedSingle`: returns correct cell+value when exactly one candidate exists; returns null when no naked singles
- [ ] Test `findHiddenSingleInRow`: returns correct cell+value for a digit with one valid row cell; returns null when none
- [ ] Test `findHiddenSingleInColumn`: same for column
- [ ] Test `findHiddenSingleInBox`: same for 3×3 box
- [ ] Test `getHint` fallback: returns a hint from solution when no logical strategy applies
- [ ] Test `getHint` returns null on fully solved board
- [ ] Use the standard deterministic board from other tests (SOLUTION from `vi.hoisted`)

### Task 9: Tests — hint store
- [ ] Create `src/store/hintStore.test.ts` (with same `vi.hoisted` + `vi.mock("../sudoku")` boilerplate)
- [ ] `beforeEach`: `newGame("easy")` + `dismissHint()`
- [ ] Test `showHint()` sets `hintState.hint` to a non-null value
- [ ] Test `showHint()` calls `selectCell()` to move selection to the hint cell
- [ ] Test `showHint()` is a no-op when the game is won
- [ ] Test `dismissHint()` clears `hintState.hint`
- [ ] Test auto-dismiss: after `showHint()`, call `placeNumber()` then `await Promise.resolve()` — `hintState.hint` should be null (Valtio subscribe is microtask-based)

### Task 10: README
- [ ] Add "Hint" to the keyboard shortcuts / features section in `README.md`

---

## Critical files

| File                              | Change              |
|-----------------------------------|---------------------|
| `src/hint.ts`                     | New — pure logic    |
| `src/hint.test.ts`                | New — unit tests    |
| `src/store/hintStore.ts`          | New — Valtio store  |
| `src/store/hintStore.test.ts`     | New — store tests   |
| `src/components/NumberPad.tsx`    | Add Hint button     |
| `src/useKeyboard.ts`              | Add `v` key + Esc   |
| `src/components/StatusBar.tsx`    | Show hint content   |
| `src/App.tsx`                     | Wire onHint + won   |
| `src/index.css`                   | `.hint-btn` styles  |
| `README.md`                       | Document feature    |

## Reused utilities

- `isValidPlacement` from `src/sudoku.ts` — used in `getCandidates`
- `selectCell` from `src/store/gameStore.ts` — used in `showHint()` to move selection to hint cell
- `gameData`, `gameUI` from `src/store/gameStore.ts` — read board and solution
- `computeWon` from `src/store/gameStore.ts` — guard in `showHint()`
- `subscribe` from `valtio` — auto-dismiss on board change
- Existing StatusBar label/text/shortcuts rendering (no new CSS needed there)

## Verification

1. Run `npm run dev` and open the game
2. Play a few cells, then press `v` — StatusBar should show `HINT` label with explanation; board should select the hint cell
3. Click "Hint" button — same behavior
4. Make a move — hint should auto-dismiss
5. Press `v` again after winning — nothing should happen
6. Run `npm run lint` and `npm run check` — no errors
7. Run `npm run test` — all existing tests pass (no regressions)
