# Multi-Bug Fix and Feature Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 bugs/features: mobile scroll, mobile touch actions, ghost gear button, master difficulty, custom complexity, improved hints, and ASCII import.

**Architecture:** Mostly targeted edits — CSS fixes, store extensions, component prop additions, and a new parse function in `export.ts`.

**Tech Stack:** React 19, TypeScript, Valtio, CSS (no new deps needed).

---

## Context

The game has several mobile/UX issues and missing features:
1. PWA mode allows drag; Safari shows unnecessary scroll
2. Key actions (`w`/`W` fill candidates, `x` fill last empty) are keyboard-only — unreachable on mobile
3. Gear button has a visible background rectangle at all times (should be ghost/transparent until pressed)
4. Gap between hard (53 removals) and expert (58) with no intermediate difficulty
5. No way to set a custom cell-removal count
6. Hints fallback on expert picks the top-left empty cell with no strategy reasoning
7. No way to import an ASCII board (only export via `p` key)

---

## Critical Files

- `src/index.css` — all styles
- `src/sudoku.ts` — `Difficulty` type, `generatePuzzle`, `solve`
- `src/store/gameStore.ts` — `GameUI`, `newGame`, `fillCandidateNotes`, `fillLastDigit`
- `src/export.ts` — `boardToAscii` (add `boardFromAscii`)
- `src/hint.ts` — `getHint`, fallback logic
- `src/App.tsx` — difficulty buttons, NumberPad wiring
- `src/components/NumberPad.tsx` — buttons + props
- `src/components/SettingsPanel.tsx` — gear + settings UI

---

### Task 1: Fix mobile scroll and PWA drag

**Files:** `src/index.css`

**Step 1: Change `html` and `body` height to prevent scroll**

In `src/index.css`, replace the `body` block (line 101–107):

```css
html {
    height: 100%;
    overscroll-behavior: none;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-bg);
    display: flex;
    justify-content: center;
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
}
```

**Step 2: Make `.app` scrollable internally (fallback for very small screens)**

Replace `min-height` on `.app` — add:
```css
.app {
    /* existing: display:flex; flex-direction:column; align-items:center; padding; max-width:540px; width:100%; */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
```

**Step 3: Verify manually**
- Open in iOS Safari as site → no page scroll (board fits screen)
- Add to home screen → no drag/bounce gesture
- `npm run check` — no linting errors

---

### Task 2: Add "master" difficulty

**Files:** `src/sudoku.ts`, `src/App.tsx`, (tests if type is referenced)

**Step 1: Update `Difficulty` type in `src/sudoku.ts` line 2**

```typescript
export type Difficulty = "easy" | "medium" | "hard" | "master" | "expert"
```

**Step 2: Add `master: 55` to `removals` map (line 122–127)**

```typescript
const removals: Record<Difficulty, number> = {
    easy:   38,
    medium: 46,
    hard:   53,
    master: 55,
    expert: 58,
}
```

**Step 3: Update difficulty button array in `src/App.tsx` line 30**

```typescript
["easy", "medium", "hard", "master", "expert"] as Difficulty[]
```

**Step 4: Run tests**

```bash
npm run test
```

All tests should pass (the `Difficulty` type change is backwards-compatible for existing test mocks).

**Step 5: Commit**

```bash
git add src/sudoku.ts src/App.tsx
git commit -m "feat: add master difficulty (55 cells removed)"
```

---

### Task 3: Ghost gear button

**Files:** `src/index.css` (lines 518–539)

**Step 1: Replace `.settings-gear` styles**

Current default shows `border: 1px solid var(--color-border)` and `background: var(--color-surface)`.

New default — transparent; border/background only on interaction:

```css
.settings-gear {
    position: fixed;
    top: max(16px, env(safe-area-inset-top));
    right: max(16px, env(safe-area-inset-right));
    width: 36px;
    height: 36px;
    border: 1px solid transparent;
    border-radius: var(--radius-btn);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    transition: all 0.15s;
}

.settings-gear:hover,
.settings-gear:active {
    border-color: var(--color-border);
    background: var(--color-surface);
    color: var(--color-primary);
}
```

**Step 2: Verify**

- Gear icon visible, no rectangle background at rest
- Rectangle appears on hover (desktop) and tap (mobile)
- `npm run check`

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: ghost gear button - hide border/bg until hover/press"
```

---

### Task 4: Mobile touch buttons for fill actions

**Files:** `src/components/NumberPad.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: Add two props to `NumberPadProps` interface**

```typescript
interface NumberPadProps {
    // ... existing props ...
    onFillCell: () => void    // w — fill candidate notes for selected cell
    onFillLast: () => void    // x — fill last digit in row/col/box
    selected: boolean         // whether any cell is selected (for disabling)
}
```

**Step 2: Add two buttons to `NumberPad` JSX, after the Hint button**

```tsx
<button
    type="button"
    className="num-btn fill-notes-btn"
    disabled={won}
    onClick={onFillCell}
>
    Notes✦
</button>
<button
    type="button"
    className="num-btn fill-last-btn"
    disabled={won || !selected}
    onClick={onFillLast}
>
    Fill
</button>
```

**Step 3: Wire in `src/App.tsx`**

Import `fillCandidateNotes`, `fillLastDigit`, `findLastOneCell` from `./store/gameStore`.

Add props to `<NumberPad>`:
```tsx
onFillCell={fillCandidateNotes}
onFillLast={() => {
    if (findLastOneCell(game.board, game.selected)) fillLastDigit()
}}
selected={game.selected !== null}
```

Wait — `game.board` and `game.selected` come from `useGame()`. But `fillLastDigit` reads from store directly, and `findLastOneCell` needs the board and selected position. Since `fillLastDigit` already calls `findLastOneCell` internally, just call `fillLastDigit()` directly; it no-ops if no cell qualifies.

Simplify: `onFillLast={fillLastDigit}` — `fillLastDigit` already guards internally via `findLastOneCell`.

**Step 4: Add CSS for new buttons in `src/index.css`**

They use the existing `num-btn` class, so no new rules needed (they'll match existing size/style). If a distinct visual treatment is wanted, add optional modifier class styles.

**Step 5: Run tests**

```bash
npm run test
```

**Step 6: Commit**

```bash
git add src/components/NumberPad.tsx src/App.tsx
git commit -m "feat: add fill-notes and fill-last touch buttons to number pad"
```

---

### Task 5: Custom complexity in settings panel

**Files:** `src/store/gameStore.ts`, `src/sudoku.ts`, `src/components/SettingsPanel.tsx`, `src/index.css`

**Step 1: Add `customCells: number | null` to `GameUI` interface in `gameStore.ts`**

```typescript
interface GameUI {
    solution: Board
    initial: boolean[][]
    selected: CellPos | null
    difficulty: Difficulty
    elapsed: number
    notesMode: boolean
    customCells: number | null   // null = preset difficulty; number = custom
}
```

Update `createInitialUI` to include `customCells: null`.

**Step 2: Add `newCustomGame` function in `gameStore.ts`**

The existing `generatePuzzle` uses `removals[difficulty]`. Add a separate path:

In `src/sudoku.ts`, add:
```typescript
export function generateCustomPuzzle(cellsToRemove: number): {
    puzzle: Board
    solution: Board
} {
    const solution = generateSolvedBoard()
    const puzzle = solution.map((row) => [...row])
    const positions = shuffle(
        Array.from(
            { length: 81 },
            (_, i) => [Math.floor(i / 9), i % 9] as [number, number],
        ),
    )
    let removed = 0
    for (const [r, c] of positions) {
        if (removed >= cellsToRemove) break
        const saved = puzzle[r][c]
        puzzle[r][c] = 0
        if (!hasUniqueSolution(puzzle)) {
            puzzle[r][c] = saved
        } else {
            removed++
        }
    }
    return { puzzle, solution }
}
```

Note: `hasUniqueSolution` and `generateSolvedBoard` are not yet exported. Check if they are — if not, export them or inline. Looking at `sudoku.ts`, these are local functions. Export `generateSolvedBoard` and `hasUniqueSolution`.

In `gameStore.ts`:
```typescript
import { generateCustomPuzzle } from "../sudoku"

export function newCustomGame(cellsToRemove: number) {
    const clamped = Math.max(20, Math.min(64, cellsToRemove))
    const { puzzle, solution } = generateCustomPuzzle(clamped)

    const data = createInitialData(puzzle)
    gameData.value.board = data.board
    gameData.value.notes = data.notes
    gameData.history.nodes.splice(0)
    gameData.history.index = -1
    gameData.saveHistory()

    const ui = createInitialUI(solution, puzzle, "easy")  // difficulty label irrelevant
    gameUI.solution = ui.solution
    gameUI.initial = ui.initial
    gameUI.selected = ui.selected
    gameUI.difficulty = ui.difficulty
    gameUI.elapsed = 0
    gameUI.notesMode = false
    gameUI.customCells = clamped
}
```

Also update `newGame` to set `gameUI.customCells = null`.

**Step 3: Expose in `useGame.ts`**

Add `customCells: snap.customCells` and `newCustomGame` to the return value of `useGame`.

**Step 4: Add UI to `SettingsPanel.tsx`**

Add a section below theme options:
```tsx
<h3>Custom Difficulty</h3>
<div className="custom-difficulty">
    <label htmlFor="custom-cells">Cells removed</label>
    <input
        id="custom-cells"
        type="number"
        min={20}
        max={64}
        value={customValue}
        onChange={(e) => setCustomValue(Number(e.target.value))}
        className="custom-cells-input"
    />
    <button
        type="button"
        className="custom-play-btn"
        onClick={() => { newCustomGame(customValue); setOpen(false) }}
    >
        Play
    </button>
</div>
```

Use local `useState` for `customValue` (default 50). Call `newCustomGame` from import.

**Step 5: Add CSS in `src/index.css`**

```css
.custom-difficulty {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
}

.custom-cells-input {
    width: 56px;
    padding: 4px 8px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-btn);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 0.9rem;
    text-align: center;
}

.custom-play-btn {
    padding: 4px 12px;
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-btn);
    background: var(--color-primary);
    color: var(--color-text-on-primary);
    font-size: 0.85rem;
    cursor: pointer;
}
```

**Step 6: Run tests and check**

```bash
npm run test && npm run check
```

**Step 7: Commit**

```bash
git add src/sudoku.ts src/store/gameStore.ts src/components/SettingsPanel.tsx src/index.css
git commit -m "feat: custom difficulty via cell-removal count in settings panel"
```

---

### Task 6: Fix hints fallback (smarter cell selection)

**Files:** `src/hint.ts`

**Problem:** `getHint` falls back to the first empty cell scanned (top-left, r=0,c=0). On expert puzzles where no naked/hidden singles exist, this gives a random-feeling hint with no useful explanation.

**Fix:** Use MRV (minimum remaining values) — pick the most constrained cell (fewest candidates). This is a real solving concept and feels less arbitrary.

**Step 1: Replace fallback block in `getHint` (lines 136–143 in `src/hint.ts`)**

Current code:
```typescript
// Fallback: use solution
const value = solution[r][c]
return {
    cell: { row: r, col: c },
    value,
    strategy: "fallback",
    explanation: `Try placing ${value} here.`,
}
```

Replace with (the `for r/c` loop above finds the first empty cell — replace that whole fallback logic):

```typescript
// Fallback: find most constrained empty cell (fewest candidates = MRV heuristic)
let bestCell: { row: number; col: number } | null = null
let bestCount = 10
for (let fr = 0; fr < 9; fr++) {
    for (let fc = 0; fc < 9; fc++) {
        if (board[fr][fc] !== 0) continue
        const candidates = getCandidates(board, fr, fc)
        if (candidates.length < bestCount) {
            bestCount = candidates.length
            bestCell = { row: fr, col: fc }
        }
    }
}
if (bestCell) {
    const value = solution[bestCell.row][bestCell.col]
    const noun = bestCount === 1 ? "candidate" : "candidates"
    return {
        cell: bestCell,
        value,
        strategy: "fallback",
        explanation: `This cell has only ${bestCount} ${noun} — try placing ${value} here.`,
    }
}
return null
```

Note: The outer `for r/c` loop in `getHint` currently serves dual purpose (find first empty + fallback). Restructure `getHint` so the strategy check and fallback are cleanly separated — the first empty cell check is only needed to determine if there are any empty cells at all.

**Refactored `getHint`:**
```typescript
export function getHint(board: Board, solution: Board): Hint | null {
    // Check if any empty cells remain
    const hasEmpty = board.some((row) => row.some((v) => v === 0))
    if (!hasEmpty) return null

    const hint =
        findNakedSingle(board) ??
        findHiddenSingleInRow(board) ??
        findHiddenSingleInColumn(board) ??
        findHiddenSingleInBox(board)
    if (hint) return hint

    // Fallback: most constrained cell (MRV heuristic)
    let bestCell: { row: number; col: number } | null = null
    let bestCount = 10
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== 0) continue
            const count = getCandidates(board, r, c).length
            if (count < bestCount) {
                bestCount = count
                bestCell = { row: r, col: c }
            }
        }
    }
    if (!bestCell) return null
    const value = solution[bestCell.row][bestCell.col]
    const noun = bestCount === 1 ? "candidate" : "candidates"
    return {
        cell: bestCell,
        value,
        strategy: "fallback",
        explanation: `This cell has only ${bestCount} ${noun} — try placing ${value} here.`,
    }
}
```

**Step 2: Run existing hint tests**

```bash
npx vitest run src/hint.test.ts
```

If no hint test file exists, check `src/store/hintStore.test.ts`.

**Step 3: Commit**

```bash
git add src/hint.ts
git commit -m "fix: hint fallback uses most-constrained cell (MRV) with better explanation"
```

---

### Task 7: Import ASCII board

**Files:** `src/export.ts`, `src/sudoku.ts` (export `solve`), `src/store/gameStore.ts`, `src/components/SettingsPanel.tsx`, `src/index.css`

**Step 1: Add `boardFromAscii` to `src/export.ts`**

```typescript
export function boardFromAscii(text: string): number[][] | null {
    const dataLines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("|"))
    if (dataLines.length !== 9) return null
    const board: number[][] = []
    for (const line of dataLines) {
        const cells = line.replace(/\|/g, "").trim().split(/\s+/)
        if (cells.length !== 9) return null
        const row = cells.map((ch) => (ch === "." ? 0 : parseInt(ch, 10)))
        if (row.some((v) => isNaN(v) || v < 0 || v > 9)) return null
        board.push(row)
    }
    return board.length === 9 ? board : null
}
```

**Step 2: Export `solve` from `src/sudoku.ts`**

The `solve` function is currently unexported. Change:
```typescript
function solve(board: Board, randomize = false): boolean {
```
to:
```typescript
export function solve(board: Board, randomize = false): boolean {
```

**Step 3: Add `loadBoard` action in `src/store/gameStore.ts`**

```typescript
import { solve, generateCustomPuzzle } from "../sudoku"

export function loadBoard(puzzle: number[][]): boolean {
    // Clone and solve to get the solution
    const solutionBoard = puzzle.map((row) => [...row])
    const solved = solve(solutionBoard)
    if (!solved) return false   // Not solvable

    const data = createInitialData(puzzle.map((row) => [...row]))
    gameData.value.board = data.board
    gameData.value.notes = data.notes
    gameData.history.nodes.splice(0)
    gameData.history.index = -1
    gameData.saveHistory()

    gameUI.solution = solutionBoard
    gameUI.initial = puzzle.map((row) => row.map((v) => v !== 0))
    gameUI.selected = null
    gameUI.elapsed = 0
    gameUI.notesMode = false
    gameUI.customCells = null
    return true
}
```

**Step 4: Add import UI to `src/components/SettingsPanel.tsx`**

Add local state `importOpen: boolean` and `importText: string`.

Add an "Import" button below the theme section. When clicked, show a textarea and "Load" + "Cancel" buttons:

```tsx
{importOpen && (
    <div className="import-section">
        <textarea
            className="import-textarea"
            placeholder="Paste ASCII board here..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={11}
        />
        <div className="import-actions">
            <button
                type="button"
                className="import-load-btn"
                onClick={() => {
                    const parsed = boardFromAscii(importText)
                    if (!parsed || !loadBoard(parsed)) {
                        setImportError(true)
                        return
                    }
                    setImportOpen(false)
                    setImportText("")
                    setImportError(false)
                    setOpen(false)
                }}
            >
                Load
            </button>
            <button
                type="button"
                className="import-cancel-btn"
                onClick={() => { setImportOpen(false); setImportError(false) }}
            >
                Cancel
            </button>
        </div>
        {importError && (
            <p className="import-error">Could not parse board. Check the format.</p>
        )}
    </div>
)}
```

Add `importOpen`, `importText`, `importError` via `useState`.

**Step 5: Add CSS for import section**

```css
.import-section {
    margin-top: 12px;
}

.import-textarea {
    width: 100%;
    font-family: monospace;
    font-size: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-btn);
    background: var(--color-surface);
    color: var(--color-text);
    padding: 8px;
    resize: none;
}

.import-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
}

.import-load-btn {
    flex: 1;
    padding: 6px;
    background: var(--color-primary);
    color: var(--color-text-on-primary);
    border: none;
    border-radius: var(--radius-btn);
    cursor: pointer;
    font-size: 0.85rem;
}

.import-cancel-btn {
    flex: 1;
    padding: 6px;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-btn);
    cursor: pointer;
    font-size: 0.85rem;
}

.import-error {
    color: var(--color-text-error);
    font-size: 0.8rem;
    margin-top: 6px;
}
```

**Step 6: Add `boardFromAscii` and `loadBoard` imports in `SettingsPanel.tsx`**

```typescript
import { boardFromAscii } from "../export"
import { loadBoard } from "../store/gameStore"
```

**Step 7: Run tests**

```bash
npm run test && npm run check
```

**Step 8: Commit**

```bash
git add src/export.ts src/sudoku.ts src/store/gameStore.ts src/components/SettingsPanel.tsx src/index.css
git commit -m "feat: import ASCII board in settings panel"
```

---

## Verification (end-to-end)

1. **Mobile scroll:** Open in iOS Safari → page should not scroll; add to home screen → no drag bounce
2. **Master difficulty:** Click "Master" button → new game generates (between hard and expert density)
3. **Ghost gear:** Gear icon visible at rest, rectangle appears only on tap/hover
4. **Fill buttons:** Select a cell on mobile → tap "Notes✦" to fill candidate notes; tap "Fill" when row has one empty → it fills
5. **Custom complexity:** Open settings → enter 45 in cells input → click Play → new game starts with ~45 cells removed, no difficulty button highlighted
6. **Hints on expert:** Start expert game → tap Hint → should select a cell with fewest candidates, not necessarily top-left; explanation mentions candidate count
7. **Import:** Open settings → click Import → paste exported ASCII → click Load → game loads with correct initial cells locked

Run full test suite: `npm run test`
Run lint + format: `npm run check`
