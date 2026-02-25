# Plan: 5 UI Improvements

## Context

Five independent improvements to the Sudoku game's UI/UX:
1. Show "digit all placed" state visually on the board cells (not just disabled number pad buttons)
2. Fix status bar layout broken on mobile (fixed positioning overlaps number pad)
3. Animate a row/column/box with a green flash when all 9 cells are filled
4. Improve selected-cell (cursor) contrast so it's easier to spot
5. Add an "Expert" difficulty harder than Hard

---

## Task 1: Digit-complete visual on the board

- [x] Compute `completedDigits` in `Board.tsx` and pass `isDigitComplete` to `Cell`
- [x] Add `isDigitComplete` prop to `Cell.tsx` and apply `.cell-digit-complete` class
- [x] Add `.cell-digit-complete` CSS rule in `index.css`

**Problem:** When all 9 of a digit are placed, only the number pad button dims. The board cells look identical to uncompleted digits.

**Approach:** Pass a `Set<number>` of completed digits down to each `Cell`. Apply a `.cell-digit-complete` class that dims the cell's text — signaling the digit is fully placed without being distracting.

**Files:**
- `src/components/Board.tsx` — compute `completedDigits` from `board`, pass `isDigitComplete` to `Cell`
- `src/components/Cell.tsx` — add `isDigitComplete` prop, apply `.cell-digit-complete`
- `src/index.css` — add `.cell-digit-complete` style (muted/dimmed text color)

**Details:**
```ts
// Board.tsx — inside Board() before return
const completedDigits = new Set<number>()
const digitCounts = new Map<number, number>()
for (const row of board)
    for (const v of row)
        if (v !== 0) digitCounts.set(v, (digitCounts.get(v) ?? 0) + 1)
for (const [digit, count] of digitCounts)
    if (count >= 9) completedDigits.add(digit)
```

```css
/* index.css */
.cell-digit-complete {
    color: #adb5bd; /* muted grey instead of blue/dark */
}
```

The `isDigitComplete` flag must NOT override error color — only apply the dim when not in error state. In `Cell.tsx`, the class order ensures this: `.cell-error` text color wins due to specificity / being added after `cell-digit-complete`.

---

## Task 2: Fix status bar on mobile

- [x] Remove fixed positioning from `.status-bar` and allow shortcut items to wrap

**Problem:** `.status-bar` uses `position: fixed; bottom: 20px` and `white-space: nowrap`. On narrow mobile screens the bar overlaps the number pad or clips off screen.

**Approach:** Remove fixed positioning. Let the status bar flow normally in the document (it's already placed after `<NumberPad>` in `App.tsx`). Allow shortcut items to wrap.

**Files:**
- `src/index.css` — update `.status-bar`

**Change:**
- Remove `position: fixed`, `bottom: 20px`, `left: 50%`, `transform: translateX(-50%)`
- Add `margin-top: 12px`, `flex-wrap: wrap`, `justify-content: center`
- Remove `white-space: nowrap`
- Keep visual style (transparent bg, gap, font-size, animation)

---

## Task 3: Animate completed row/column/box

- [x] Compute `completedRows`, `completedCols`, `completedBoxes` in `Board.tsx` and pass `isLineComplete` to `Cell`
- [x] Add `isLineComplete` prop to `Cell.tsx` and apply `.cell-line-complete` class
- [x] Add `@keyframes line-complete-flash` and `.cell-line-complete::after` CSS rule in `index.css`

**Problem:** No visual feedback when a row, column, or 3×3 box becomes fully filled.

**Approach:** In `Board.tsx`, compute which rows/cols/boxes are fully filled (no zeros). Pass `isLineComplete` to each `Cell`. In CSS, use a `::after` pseudo-element with a one-shot keyframe animation (green flash that fades out). The animation fires naturally when the class is added to a DOM element.

**Files:**
- `src/components/Board.tsx` — compute `completedRows`, `completedCols`, `completedBoxes`; pass `isLineComplete` to Cell
- `src/components/Cell.tsx` — add `isLineComplete` prop, apply `.cell-line-complete`
- `src/index.css` — add `@keyframes` + `.cell-line-complete::after`

**Details:**
```ts
// Board.tsx
const completedRows = new Set<number>()
const completedCols = new Set<number>()
const completedBoxes = new Set<number>()
for (let r = 0; r < 9; r++)
    if (board[r].every(v => v !== 0)) completedRows.add(r)
for (let c = 0; c < 9; c++)
    if (board.every(row => row[c] !== 0)) completedCols.add(c)
for (let br = 0; br < 3; br++)
    for (let bc = 0; bc < 3; bc++) {
        let full = true
        for (let r = br*3; r < br*3+3 && full; r++)
            for (let c = bc*3; c < bc*3+3 && full; c++)
                if (board[r][c] === 0) full = false
        if (full) completedBoxes.add(br*3+bc)
    }
// Then per-cell:
const isLineComplete =
    completedRows.has(r) ||
    completedCols.has(c) ||
    completedBoxes.has(Math.floor(r/3)*3 + Math.floor(c/3))
```

```css
/* index.css */
@keyframes line-complete-flash {
    0%   { background: rgba(76, 175, 80, 0.45); }
    100% { background: rgba(76, 175, 80, 0); }
}

.cell-line-complete::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    animation: line-complete-flash 0.7s ease-out;
}
```

The `::after` is created when the class is added (completing a line) and destroyed when the class is removed (undo). Re-adding triggers the animation again. `.cell` already has `position: relative`, so `inset: 0` works.

---

## Task 4: Improve selected-cell cursor contrast

- [x] Add `box-shadow: inset 0 0 0 2px var(--color-primary)` to `.cell-selected` in `index.css`

**Problem:** `--color-selected: #bbdefb` is too close in lightness to `--color-highlighted` and `--color-same-number`, making the cursor hard to spot.

**Approach:** Add a strong inset border to `.cell-selected` using `box-shadow` (no layout impact). Keep the existing light-blue background as a secondary cue.

**Files:**
- `src/index.css`

**Change:**
```css
/* Update .cell-selected: */
.cell-selected {
    background: var(--color-selected);
    box-shadow: inset 0 0 0 2px var(--color-primary);
}
```

This draws a 2px blue border inside the cell without affecting grid layout. The color `#1976d2` is much darker than the light-blue backgrounds, making the cursor unambiguous.

---

## Task 5: Add Expert difficulty

- [x] Extend `Difficulty` type in `sudoku.ts` with `"expert"` and add `expert: 58` to `removals`
- [x] Add `"expert"` to the difficulty array in `App.tsx`

**Problem:** The hardest level is "Hard" (53 cells removed, 28 given). Expert removes 58 cells (23 given), closer to the theoretical minimum of 17.

**Approach:** Add `"expert"` to the `Difficulty` union type in `sudoku.ts`, add its removal count to the `removals` map, and add an "Expert" button in `App.tsx`.

**Files:**
- `src/sudoku.ts` — extend `Difficulty` type, add `expert: 58` to `removals`
- `src/App.tsx` — add `"expert"` to the difficulty array in the toolbar

**Details:**
```ts
// sudoku.ts
export type Difficulty = "easy" | "medium" | "hard" | "expert"

const removals: Record<Difficulty, number> = {
    easy: 38,
    medium: 46,
    hard: 53,
    expert: 58,
}
```

```tsx
// App.tsx
{(["easy", "medium", "hard", "expert"] as Difficulty[]).map(...)
```

Note: `store/gameStore.ts` imports `Difficulty` from `../sudoku`, so no changes needed there.

---

---

## Task 6: `w` / `Shift+W` — fill cell(s) with candidate notes

**Feature:** `w` fills the selected cell's notes with all valid candidates (digits not already present in the cell's row, column, or box). `Shift+W` does the same for every empty non-initial cell on the board. Both save a single undo history entry.

### Logic

Uses the existing `isValidPlacement(board, r, c, n)` from `sudoku.ts` (already imported in the store) to determine valid digits for a cell.

**Files:**
- `src/store/gameStore.ts` — add `fillCandidateNotes()` and `fillAllCandidateNotes()`
- `src/useKeyboard.ts` — handle `e.key === "w"` and `e.key === "W"`
- `src/components/StatusBar.tsx` — add `W` hint to default shortcuts
- `src/store/gameStore.test.ts` — new `describe` block with tests

### Store functions

```ts
// gameStore.ts — import isValidPlacement at top (already available via sudoku.ts)
import { ..., isValidPlacement } from "../sudoku"

export function fillCandidateNotes() {
    const sel = gameUI.selected
    if (!sel) return
    if (gameUI.initial[sel.row][sel.col]) return
    if (gameData.value.board[sel.row][sel.col] !== 0) return

    const candidates: number[] = []
    for (let n = 1; n <= 9; n++) {
        if (isValidPlacement(gameData.value.board, sel.row, sel.col, n))
            candidates.push(n)
    }
    gameData.value.notes[sel.row][sel.col] = candidates
    gameData.saveHistory()
}

export function fillAllCandidateNotes() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (gameUI.initial[r][c]) continue
            if (gameData.value.board[r][c] !== 0) continue
            const candidates: number[] = []
            for (let n = 1; n <= 9; n++) {
                if (isValidPlacement(gameData.value.board, r, c, n))
                    candidates.push(n)
            }
            gameData.value.notes[r][c] = candidates
        }
    }
    gameData.saveHistory()
}
```

### Keyboard

```ts
// useKeyboard.ts — add inside the else-if chain
} else if (e.key === "w") {
    fillCandidateNotes()
} else if (e.key === "W") {
    fillAllCandidateNotes()
}
```

### StatusBar shortcut hint

Add to the default shortcuts array:
```ts
{ key: "W", action: "candidates" }
```

### Tests (in `src/store/gameStore.test.ts`)

The test puzzle (`makePuzzle()`) has exactly 4 empty cells. Computing valid candidates with `isValidPlacement` on the test board yields:

| Cell   | Valid candidates |
|--------|-----------------|
| [0][0] | [5]             |
| [0][1] | [3]             |
| [4][4] | [5]             |
| [8][8] | [9]             |

Test cases to add in a `describe("fillCandidateNotes", ...)` block:
- Fills correct candidates for selected empty cell
- Replaces (overwrites) any existing notes in the cell
- Skips initial (given) cells — no change
- Skips cells that already have a value placed — no change
- No-ops when no cell is selected
- Saves a single undo history entry (undo restores to empty notes)

Test cases in `describe("fillAllCandidateNotes", ...)`:
- Fills all 4 empty cells with correct candidates in one call
- Does not touch initial cells
- Does not touch cells with values
- Saves as single undo entry (one undo restores all notes)

---

## Verification

```
### Task N:
- [ ] Run `npm run check` — no lint/format errors
- [ ] Run `npm run test` — all tests pass
- [ ] Run `npm run dev` — manual check:
  - Place the 9th of a digit → board cells with that digit should dim
  - Fill all 9 cells in a row/col/box → green flash animation plays
  - Selected cell has visible blue border ring
  - Status bar shows below number pad (not overlapping) on narrow window
  - Expert button appears; starting Expert game generates a valid puzzle
  - Press W on an empty cell → notes fill with valid candidates
  - Press Shift+W → all empty cells fill with valid candidates at once
  - Undo after W/Shift+W → notes cleared (single undo step)
```
