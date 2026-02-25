import type { CellPos } from "../useGame"
import { Cell } from "./Cell"

export interface CellOverlay {
    label: string
    dimmed: boolean
}

interface BoardProps {
    board: number[][]
    initial: boolean[][]
    selected: CellPos | null
    errors: Set<string>
    notes: readonly (readonly number[])[][]
    won: boolean
    onSelectCell: (pos: CellPos) => void
    overlay?: (row: number, col: number) => CellOverlay | null
}

export function Board({
    board,
    initial,
    selected,
    errors,
    notes,
    won,
    onSelectCell,
    overlay,
}: BoardProps) {
    const selectedValue = selected ? board[selected.row][selected.col] : 0

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

    const completedRows = new Set<number>()
    const completedCols = new Set<number>()
    const completedBoxes = new Set<number>()
    for (let r = 0; r < 9; r++)
        if (
            board[r].every((v) => v !== 0) &&
            !board[r].some((_, c) => errors.has(`${r},${c}`))
        )
            completedRows.add(r)
    for (let c = 0; c < 9; c++)
        if (board.every((row, r) => row[c] !== 0 && !errors.has(`${r},${c}`)))
            completedCols.add(c)
    for (let br = 0; br < 3; br++)
        for (let bc = 0; bc < 3; bc++) {
            let full = true
            for (let r = br * 3; r < br * 3 + 3 && full; r++)
                for (let c = bc * 3; c < bc * 3 + 3 && full; c++)
                    if (board[r][c] === 0 || errors.has(`${r},${c}`))
                        full = false
            if (full) completedBoxes.add(br * 3 + bc)
        }

    return (
        <div className="board">
            {board.map((row, r) =>
                row.map((value, c) => {
                    const isSelected =
                        selected?.row === r && selected?.col === c
                    const isHighlighted =
                        !isSelected &&
                        selected != null &&
                        (selected.row === r ||
                            selected.col === c ||
                            (Math.floor(selected.row / 3) ===
                                Math.floor(r / 3) &&
                                Math.floor(selected.col / 3) ===
                                    Math.floor(c / 3)))
                    const isSameNumber =
                        !isSelected &&
                        selectedValue !== 0 &&
                        value === selectedValue
                    const isError = errors.has(`${r},${c}`)
                    const isLineComplete =
                        !won &&
                        (completedRows.has(r) ||
                            completedCols.has(c) ||
                            completedBoxes.has(
                                Math.floor(r / 3) * 3 + Math.floor(c / 3),
                            ))

                    return (
                        <Cell
                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed 9x9 grid never reorders
                            key={`${r}-${c}`}
                            value={value}
                            isInitial={initial[r][c]}
                            isSelected={isSelected}
                            isHighlighted={isHighlighted}
                            isSameNumber={isSameNumber}
                            isError={isError}
                            isDigitComplete={
                                value !== 0 && completedDigits.has(value)
                            }
                            isLineComplete={isLineComplete}
                            notes={notes[r][c]}
                            overlay={overlay?.(r, c)}
                            onClick={() => onSelectCell({ row: r, col: c })}
                        />
                    )
                }),
            )}
        </div>
    )
}
