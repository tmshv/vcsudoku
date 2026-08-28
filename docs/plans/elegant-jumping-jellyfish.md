# ASCII Export Feature

## Context

Users want to share their current Sudoku board state as text. Pressing `p` will convert the board to a bordered ASCII grid and copy it to the clipboard.

Output format:
```
+-------+-------+-------+
| 5 3 . | . 7 . | . . . |
| 6 . . | 1 9 5 | . . . |
| . 9 8 | . . . | . 6 . |
+-------+-------+-------+
| 8 . . | . 6 . | . . 3 |
| 4 . . | 8 . 3 | . . 1 |
| 7 . . | . 2 . | . . 6 |
+-------+-------+-------+
| . 6 . | . . . | 2 8 . |
| . . . | 4 1 9 | . . 5 |
| . . . | . 8 . | . 7 9 |
+-------+-------+-------+
```

Empty cells are dots (`.`), filled cells show their digit.

---

## Critical Files

| File                               | Change             |
|------------------------------------|--------------------|
| `src/export.ts`                    | New — pure utility |
| `src/export.test.ts`               | New — unit tests   |
| `src/useKeyboard.ts`               | Add `p` handler    |
| `src/components/StatusBar.tsx`     | Add `p` hint       |

---

## Implementation

### Task 1: Create `src/export.ts`
- [ ] Create pure function `boardToAscii(board: number[][]): string`
- [ ] Separator row: `+-------+-------+-------+`
- [ ] Data row format: `| a b c | d e f | g h i |` (0 → `.`)
- [ ] Insert separator before rows 0, 3, 6 and after row 8

```typescript
const SEP = "+-------+-------+-------+"

export function boardToAscii(board: number[][]): string {
    const lines: string[] = []
    for (let row = 0; row < 9; row++) {
        if (row % 3 === 0) lines.push(SEP)
        const c = board[row].map(v => (v === 0 ? "." : String(v)))
        lines.push(`| ${c[0]} ${c[1]} ${c[2]} | ${c[3]} ${c[4]} ${c[5]} | ${c[6]} ${c[7]} ${c[8]} |`)
    }
    lines.push(SEP)
    return lines.join("\n")
}
```

### Task 2: Create `src/export.test.ts`
- [ ] Test empty board → all dots, correct separators
- [ ] Test fully filled board → all digits, no dots
- [ ] Test partial board → mixed dots and digits

### Task 3: Add `p` key to `src/useKeyboard.ts`
- [ ] Import `boardToAscii` from `./export`
- [ ] Add `else if (e.key === "p")` branch after the `"v"` hint handler
- [ ] Call `navigator.clipboard.writeText(boardToAscii(gameData.value.board))`
- [ ] No `e.preventDefault()` needed

### Task 4: Add hint to `src/components/StatusBar.tsx`
- [ ] Add `{ key: "p", action: "copy" }` to the default `shortcuts` array (line 65–72)

---

## Verification

1. `npm run test` — all tests pass including new export tests
2. `npm run check` — no lint/format errors
3. Manual: open game, press `p`, paste into text editor — verify bordered grid output
4. Manual: empty board copies with all dots; partially filled board shows correct digits
