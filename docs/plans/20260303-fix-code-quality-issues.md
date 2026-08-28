# Code Quality Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all six code quality problems identified in the QA review without changing any user-visible behavior.

**Architecture:** Pure refactoring — extract helpers and hooks to eliminate duplication, add clarifying comments, and relocate misplaced state. No new features, no logic changes.

**Tech Stack:** React 19, TypeScript 5.9, Valtio 2, Vitest 4, @testing-library/react.

---

### Task 1: Add mutation comment to `solve` in `sudoku.ts`

**Files:**
- Modify: `src/sudoku.ts:35`

**Step 1: Add a single-line comment**

Open `src/sudoku.ts`. Immediately above the `solve` function signature (line 35), the comment on line 35 needs to document mutation. Change the function opening line to:

```ts
// NOTE: Mutates `board` in place. Callers that need the original intact must pass a copy.
export function solve(board: Board, randomize = false): Board | null {
```

**Step 2: Run tests to confirm nothing changed**

```bash
npm run test
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add src/sudoku.ts
git commit -m "docs: note that solve() mutates its board argument"
```

---

### Task 2: Add comment explaining valtio-history internal access in `gameStore.ts`

**Files:**
- Modify: `src/store/gameStore.ts:202-203`

**Step 1: Add explanatory comment**

In `newGame()`, lines 202-203 read:
```ts
gameData.history.nodes.splice(0)
gameData.history.index = -1
```

Replace those two lines with:

```ts
// valtio-history has no public "reset history" API, so we directly clear the
// internal nodes array and reset the index. If valtio-history adds a public
// reset method in a future version, this should be updated to use it.
gameData.history.nodes.splice(0)
gameData.history.index = -1
```

**Step 2: Run tests**

```bash
npm run test
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "docs: explain direct valtio-history internals access in newGame"
```

---

### Task 3: Extract `clearNotesAround` helper to remove duplication in `gameStore.ts`

**Context:** `placeNumber` (lines 138–152) and `fillLastDigit` (lines 281–295) contain identical 15-line blocks that clear notes in the same row, column, and 3×3 box after placing a digit. The existing tests in `store/gameStore.test.ts` already cover both functions — no new tests are needed.

**Files:**
- Modify: `src/store/gameStore.ts`

**Step 1: Verify existing tests cover placeNumber and fillLastDigit**

```bash
npx vitest run src/store/gameStore.test.ts
```

Expected: all tests pass. Note the test count so you can verify it doesn't change.

**Step 2: Add the helper function**

In `src/store/gameStore.ts`, add the following private helper directly above `placeNumber` (before line 129):

```ts
function clearNotesAround(row: number, col: number, num: number) {
    const boxR = Math.floor(row / 3) * 3
    const boxC = Math.floor(col / 3) * 3
    for (let i = 0; i < 9; i++) {
        gameData.value.notes[row][i] = gameData.value.notes[row][i].filter(
            (n) => n !== num,
        )
        gameData.value.notes[i][col] = gameData.value.notes[i][col].filter(
            (n) => n !== num,
        )
        const br = boxR + Math.floor(i / 3)
        const bc = boxC + (i % 3)
        gameData.value.notes[br][bc] = gameData.value.notes[br][bc].filter(
            (n) => n !== num,
        )
    }
}
```

**Step 3: Replace the duplicated block in `placeNumber`**

The current `placeNumber` body after `gameData.value.notes[sel.row][sel.col] = []` and before `gameData.saveHistory()` is the 15-line block. Replace it with one call:

```ts
export function placeNumber(num: number) {
    const sel = gameUI.selected
    if (!sel) return
    if (computeWon(gameData.value.board, gameUI.solution)) return
    if (gameUI.initial[sel.row][sel.col]) return

    gameData.value.board[sel.row][sel.col] = num
    gameData.value.notes[sel.row][sel.col] = []
    clearNotesAround(sel.row, sel.col, num)

    gameData.saveHistory()
}
```

**Step 4: Replace the duplicated block in `fillLastDigit`**

Similarly, the body of `fillLastDigit` after `gameData.value.notes[pos.row][pos.col] = []` and before `gameData.saveHistory()` is the same block. Replace it:

```ts
export function fillLastDigit() {
    const pos = findLastOneCell(gameData.value.board, gameUI.selected)
    if (!pos) return

    const num = gameUI.solution[pos.row][pos.col]

    gameData.value.board[pos.row][pos.col] = num
    gameData.value.notes[pos.row][pos.col] = []
    clearNotesAround(pos.row, pos.col, num)

    gameData.saveHistory()
}
```

**Step 5: Run the store tests**

```bash
npx vitest run src/store/gameStore.test.ts
```

Expected: same number of tests, all pass.

**Step 6: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

**Step 7: Commit**

```bash
git add src/store/gameStore.ts
git commit -m "refactor: extract clearNotesAround helper to remove duplication"
```

---

### Task 4: Share `computeFull` between `Board.tsx` and `NumberPad.tsx`

**Context:** `NumberPad.tsx` has an extracted `computeFull(board, errors): Set<number>` function (lines 18–29). `Board.tsx` duplicates the same logic inline (lines 31–40) for computing `completedDigits`. This task moves `computeFull` to a shared location and updates both components to use it.

**Files:**
- Modify: `src/store/gameStore.ts` (add export)
- Modify: `src/components/Board.tsx`
- Modify: `src/components/NumberPad.tsx`

**Step 1: Export `computeFull` from `gameStore.ts`**

`gameStore.ts` already exports `computeErrors` and `computeWon`. Add `computeFull` there as a named export, below `computeWon` (after line 95):

```ts
export function computeFull(board: Board, errors: Set<string>): Set<number> {
    const counts = new Map<number, number>()
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
            const v = board[r][c]
            if (v !== 0 && !errors.has(`${r},${c}`))
                counts.set(v, (counts.get(v) ?? 0) + 1)
        }
    const full = new Set<number>()
    for (const [n, count] of counts) if (count >= 9) full.add(n)
    return full
}
```

**Step 2: Update `Board.tsx` to use the imported function**

At the top of `Board.tsx`, add the import:

```ts
import { computeFull } from "../store/gameStore"
```

Then replace the inline `completedDigits` computation (lines 31–40):

```ts
// remove this block:
const completedDigits = new Set<number>()
const digitCounts = new Map<number, number>()
for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
        const v = board[r][c]
        if (v !== 0 && !errors.has(`${r},${c}`))
            digitCounts.set(v, (digitCounts.get(v) ?? 0) + 1)
    }
for (const [digit, count] of digitCounts)
    if (count >= 9) completedDigits.add(digit)
```

Replace with:

```ts
const completedDigits = computeFull(board, errors)
```

**Step 3: Update `NumberPad.tsx` to import instead of define**

In `NumberPad.tsx`, delete the local `computeFull` function (lines 18–29) and add an import:

```ts
import { computeFull } from "../store/gameStore"
```

The rest of `NumberPad.tsx` already calls `computeFull(board, errors)` — no other changes needed there.

**Step 4: Run tests**

```bash
npm run test
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add src/store/gameStore.ts src/components/Board.tsx src/components/NumberPad.tsx
git commit -m "refactor: share computeFull from gameStore, remove duplicate in Board"
```

---

### Task 5: Extract `useFlashAnimation` hook to remove duplication between `Board.tsx` and `NumberPad.tsx`

**Context:** Both components implement a reference-counted flash animation: `flashTimersRef`, `useState(new Map)`, a cleanup `useEffect`, and a delta-detecting `useEffect`. The algorithm is identical; only the key type (`string` vs `number`) and duration (700 ms vs 1400 ms) differ. This task extracts a generic `useFlashAnimation<K>` hook and writes tests for it first.

**Files:**
- Create: `src/hooks/useFlashAnimation.ts`
- Create: `src/hooks/useFlashAnimation.test.ts`
- Modify: `src/components/Board.tsx`
- Modify: `src/components/NumberPad.tsx`

**Step 1: Write the failing tests first**

Create `src/hooks/useFlashAnimation.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useFlashAnimation } from "./useFlashAnimation"

describe("useFlashAnimation", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("flash adds keys to the map", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a", "b"])
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        expect(result.current.flashMap.has("b")).toBe(true)
    })

    it("keys are removed after duration elapses", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })

    it("overlapping flashes use reference counting to keep cell lit", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            result.current.flash(["a"])
        })
        // First timer fires — count goes from 2 to 1, key still present
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        // Second timer fires — count goes from 1 to 0, key removed
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })

    it("reset clears all flash state immediately", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a", "b"])
        })
        await act(async () => {
            result.current.reset()
        })
        expect(result.current.flashMap.size).toBe(0)
    })

    it("keys added again after reset flash correctly", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            result.current.reset()
        })
        await act(async () => {
            result.current.flash(["a"])
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })
})
```

**Step 2: Run to confirm tests fail**

```bash
npx vitest run src/hooks/useFlashAnimation.test.ts
```

Expected: FAIL with "Cannot find module './useFlashAnimation'".

**Step 3: Implement the hook**

Create `src/hooks/useFlashAnimation.ts`:

```ts
import { useEffect, useRef, useState } from "react"

export interface FlashAnimation<K> {
    flashMap: Map<K, number>
    flash: (keys: Iterable<K>) => void
    reset: () => void
}

export function useFlashAnimation<K>(duration: number): FlashAnimation<K> {
    const [flashMap, setFlashMap] = useState(() => new Map<K, number>())
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

    // Cancel all pending timers on unmount
    useEffect(() => {
        return () => {
            for (const t of timersRef.current) clearTimeout(t)
        }
    }, [])

    function flash(keys: Iterable<K>) {
        const keySet = [...keys]
        if (keySet.length === 0) return

        setFlashMap((prev) => {
            const next = new Map(prev)
            for (const k of keySet) next.set(k, (next.get(k) ?? 0) + 1)
            return next
        })

        const timer = setTimeout(() => {
            setFlashMap((prev) => {
                const next = new Map(prev)
                for (const k of keySet) {
                    const count = next.get(k) ?? 0
                    if (count <= 1) next.delete(k)
                    else next.set(k, count - 1)
                }
                return next
            })
            timersRef.current = timersRef.current.filter((t) => t !== timer)
        }, duration)

        timersRef.current.push(timer)
    }

    function reset() {
        for (const t of timersRef.current) clearTimeout(t)
        timersRef.current = []
        setFlashMap(new Map())
    }

    return { flashMap, flash, reset }
}
```

**Step 4: Run the hook tests**

```bash
npx vitest run src/hooks/useFlashAnimation.test.ts
```

Expected: all 5 tests pass.

**Step 5: Update `Board.tsx` to use the hook**

Replace the flash state + timer logic in `Board.tsx`. The component already uses `useLayoutEffect` to reset flash state on new game — this maps to `reset()`.

Remove these imports (no longer needed in Board):
- `useState` (unless used elsewhere — check)
- The `flashCells` state declaration
- `flashTimersRef`
- The cleanup `useEffect`
- The delta-detecting `useEffect` body (keep only the logic that triggers `flash()`)

Add import:
```ts
import { useFlashAnimation } from "../hooks/useFlashAnimation"
```

Inside the component, replace the flash state declarations and effects:

```ts
const { flashMap: flashCells, flash: flashBoard, reset: resetFlash } = useFlashAnimation<string>(700)

// biome-ignore lint: initial is a prop — its reference change is the intended trigger
useLayoutEffect(() => {
    resetFlash()
    prevCompletedRef.current = {
        rows: new Set<number>(),
        cols: new Set<number>(),
        boxes: new Set<number>(),
    }
}, [initial])

// biome-ignore lint: completedSig is intentional — it gates the effect to fire only when completion state changes
useEffect(() => {
    const curRows = completedRowsArr
    const curCols = completedColsArr
    const curBoxes = completedBoxesArr
    const prev = prevCompletedRef.current

    const newRows = curRows.filter((r) => !prev.rows.has(r))
    const newCols = curCols.filter((c) => !prev.cols.has(c))
    const newBoxes = curBoxes.filter((b) => !prev.boxes.has(b))

    prevCompletedRef.current = {
        rows: new Set(curRows),
        cols: new Set(curCols),
        boxes: new Set(curBoxes),
    }

    if (newRows.length === 0 && newCols.length === 0 && newBoxes.length === 0)
        return

    const cells = new Set<string>()
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) {
            const box = Math.floor(r / 3) * 3 + Math.floor(c / 3)
            if (newRows.includes(r) || newCols.includes(c) || newBoxes.includes(box))
                cells.add(`${r},${c}`)
        }

    flashBoard(cells)
}, [completedSig])
```

Remove `flashTimersRef` entirely. Remove the cleanup `useEffect`. Remove `useState` import if it's no longer used.

**Step 6: Update `NumberPad.tsx` to use the hook**

Replace the flash state + timer logic in `NumberPad.tsx`.

Add import:
```ts
import { useFlashAnimation } from "../hooks/useFlashAnimation"
```

Remove `flashTimersRef`, the flash `useState`, the cleanup `useEffect`, and the body of the delta-detecting `useEffect`. Replace flash state declarations:

```ts
const { flashMap: flashDigits, flash: flashPad } = useFlashAnimation<number>(1400)
```

The `useEffect` that detects newly completed digits shrinks to:

```ts
useEffect(() => {
    const currentFull = computeFull(board, errors)

    if (isFirstRun.current) {
        isFirstRun.current = false
        prevFull.current = currentFull
        return
    }

    const newlyComplete = [...currentFull].filter(
        (n) => !prevFull.current.has(n),
    )
    prevFull.current = currentFull

    if (newlyComplete.length === 0) return

    flashPad(newlyComplete)
}, [board, errors])
```

Remove `useState` import if it's no longer used in `NumberPad.tsx`.

**Step 7: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

**Step 8: Commit**

```bash
git add src/hooks/useFlashAnimation.ts src/hooks/useFlashAnimation.test.ts src/components/Board.tsx src/components/NumberPad.tsx
git commit -m "refactor: extract useFlashAnimation hook to remove Board/NumberPad duplication"
```

---

### Task 6: Move `copied` state out of `GameUI` into a dedicated `clipboardStore`

**Context:** `gameUI.copied` is a clipboard-feedback boolean that has nothing to do with the Sudoku game state. It is set in `useKeyboard.ts` and read in `StatusBar.tsx` (via `useStatusHint`). Moving it to a small dedicated proxy removes the coupling and keeps `GameUI` focused.

**Files:**
- Create: `src/store/clipboardStore.ts`
- Modify: `src/store/gameStore.ts` (remove `copied` field)
- Modify: `src/useKeyboard.ts` (import from clipboardStore)
- Modify: `src/components/StatusBar.tsx` (import from clipboardStore)

**Step 1: Create `clipboardStore.ts`**

Create `src/store/clipboardStore.ts`:

```ts
import { proxy } from "valtio"

interface ClipboardState {
    copied: boolean
}

export const clipboardState = proxy<ClipboardState>({ copied: false })

export function setCopied() {
    clipboardState.copied = true
    setTimeout(() => {
        clipboardState.copied = false
    }, 2000)
}
```

**Step 2: Remove `copied` from `GameUI` in `gameStore.ts`**

In `src/store/gameStore.ts`:

1. Remove `copied: boolean` from the `GameUI` interface (line 27).
2. Remove `copied: false` from `createInitialUI` return object (line 55).
3. In `newGame`, there is no explicit reset of `gameUI.copied` in the current code (it wasn't added), so nothing to remove there.

**Step 3: Update `useKeyboard.ts`**

Replace the clipboard mutation block in `useKeyboard.ts`. Find this code (lines 108–114):

```ts
} else if (e.key === "p") {
    navigator.clipboard.writeText(
        boardToAscii(gameData.value.board),
    )
    gameUI.copied = true
    setTimeout(() => {
        gameUI.copied = false
    }, 2000)
}
```

Replace with:

```ts
} else if (e.key === "p") {
    navigator.clipboard.writeText(
        boardToAscii(gameData.value.board),
    )
    setCopied()
}
```

Add the import at the top of `useKeyboard.ts`:

```ts
import { setCopied } from "./store/clipboardStore"
```

Remove `gameUI` from the `gameStore` import if it is no longer used anywhere else in `useKeyboard.ts`. (Check — `gameUI.notesMode` and `gameUI.selected` are still read in the handler, so keep `gameUI` imported.)

**Step 4: Update `StatusBar.tsx`**

In `src/components/StatusBar.tsx`, the `useStatusHint` hook reads `uiSnap.copied` (line 30). Replace:

1. Add import: `import { clipboardState } from "../store/clipboardStore"`
2. Add snapshot inside `useStatusHint`:
   ```ts
   const clipboard = useSnapshot(clipboardState)
   ```
3. Replace `uiSnap.copied` with `clipboard.copied` (line 30).
4. Remove `gameUI` from the imports in `StatusBar.tsx` if it's no longer used (check — `gameUI` is imported from gameStore for `findLastOneCell` call at line 7. After this change, `gameUI` itself isn't used directly in StatusBar since `uiSnap` comes from `useSnapshot(gameUI)`. Keep the `gameData` and `gameUI` imports, just swap `uiSnap.copied` → `clipboard.copied`).

**Step 5: Run all tests**

```bash
npm run test
```

Expected: all tests pass. The `copied` field was not directly tested (it's a UI feedback concern), so the existing test suite is sufficient to confirm nothing else broke.

**Step 6: Run lint and type-check**

```bash
npm run check
npm run build
```

Expected: no errors. TypeScript will catch any missed reference to the removed `copied` field.

**Step 7: Commit**

```bash
git add src/store/clipboardStore.ts src/store/gameStore.ts src/useKeyboard.ts src/components/StatusBar.tsx
git commit -m "refactor: move copied feedback state out of GameUI into clipboardStore"
```

---

## Summary

| Task | Change                                              | Risk   |
|------|-----------------------------------------------------|--------|
| 1    | Comment on `solve` mutation                         | None   |
| 2    | Comment on valtio-history internals                 | None   |
| 3    | Extract `clearNotesAround` helper                   | Low    |
| 4    | Share `computeFull` from gameStore                  | Low    |
| 5    | Extract `useFlashAnimation` hook + tests            | Medium |
| 6    | Move `copied` to `clipboardStore`                   | Low    |

Tasks 1–4 are safe refactors fully covered by the existing test suite. Task 5 adds a new tested hook. Task 6 is a structural cleanup that TypeScript's type checker will validate.
