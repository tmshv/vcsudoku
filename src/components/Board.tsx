import { useEffect, useLayoutEffect, useRef } from "react"
import { useFlashAnimation } from "../hooks/useFlashAnimation"
import { computeFull } from "../store/gameStore"
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
    onSelectCell: (pos: CellPos) => void
    overlay?: (row: number, col: number) => CellOverlay | null
}

export function Board({
    board,
    initial,
    selected,
    errors,
    notes,
    onSelectCell,
    overlay,
}: BoardProps) {
    const selectedValue = selected ? board[selected.row][selected.col] : 0

    const completedDigits = computeFull(board, errors)

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

    // Sorted arrays and signature string used as a stable effect dependency that
    // only changes when the actual completion state changes (not on every render).
    const completedRowsArr = [...completedRows].sort((a, b) => a - b)
    const completedColsArr = [...completedCols].sort((a, b) => a - b)
    const completedBoxesArr = [...completedBoxes].sort((a, b) => a - b)
    const completedSig = `${completedRowsArr}|${completedColsArr}|${completedBoxesArr}`

    // prevRef tracks which lines were complete on the previous relevant render so we
    // can compute the delta (newly completed lines) and only animate those cells.
    const prevCompletedRef = useRef({
        rows: new Set<number>(),
        cols: new Set<number>(),
        boxes: new Set<number>(),
    })

    // flashCells maps "r,c" keys to a reference count of active flash events covering
    // that cell. Using counts (instead of a boolean Set) ensures that intersection
    // cells shared by two overlapping flashes stay lit until the last timer clears them:
    // each timer only decrements, and a cell is removed only when its count reaches 0.
    const {
        flashMap: flashCells,
        flash: flashBoard,
        reset: resetFlash,
    } = useFlashAnimation<string>(700)

    // Reset all flash state when a new game starts (initial changes). Calls resetFlash()
    // to cancel pending timers and clear the map, then resets the previous completion
    // tracking so old animations cannot bleed into the new puzzle.
    // useLayoutEffect ensures this runs synchronously before the browser paints.
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

        if (
            newRows.length === 0 &&
            newCols.length === 0 &&
            newBoxes.length === 0
        )
            return

        const cells = new Set<string>()
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++) {
                const box = Math.floor(r / 3) * 3 + Math.floor(c / 3)
                if (
                    newRows.includes(r) ||
                    newCols.includes(c) ||
                    newBoxes.includes(box)
                )
                    cells.add(`${r},${c}`)
            }

        flashBoard(cells)
    }, [completedSig])

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
                    const isLineComplete = flashCells.has(`${r},${c}`)

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
