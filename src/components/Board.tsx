import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
    const [flashCells, setFlashCells] = useState(
        () => new Map<string, number>(),
    )

    // Holds all pending flash-clear timers so they can be cancelled on unmount or
    // new-game reset. We intentionally do NOT cancel these timers when completedSig
    // changes: each timer clears only its own cells via closure, so concurrent timers
    // are safe. Cancelling on re-run would leave cells permanently stuck in flashCells
    // if a second completion (or an undo) fires within the 700 ms window.
    const flashTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

    useEffect(() => {
        return () => {
            for (const t of flashTimersRef.current) clearTimeout(t)
        }
    }, [])

    // Reset all flash state when a new game starts (initial changes). Clears any
    // residual flashCells entries, cancels pending timers, and resets the previous
    // completion tracking so old animations cannot bleed into the new puzzle.
    // useLayoutEffect ensures this runs synchronously before the browser paints, so
    // stale flashCells from the previous game are never visible on the first frame.
    // Calling setFlashCells inside useLayoutEffect triggers a synchronous re-render
    // before paint, guaranteeing a clean slate for the new puzzle.
    // biome-ignore lint: initial is a prop — its reference change is the intended trigger
    useLayoutEffect(() => {
        for (const t of flashTimersRef.current) clearTimeout(t)
        flashTimersRef.current = []
        setFlashCells(new Map())
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

        setFlashCells((prev) => {
            const next = new Map(prev)
            for (const cell of cells) next.set(cell, (next.get(cell) ?? 0) + 1)
            return next
        })

        const timer = setTimeout(() => {
            setFlashCells((prev) => {
                const next = new Map(prev)
                for (const cell of cells) {
                    const count = next.get(cell) ?? 0
                    if (count <= 1) next.delete(cell)
                    else next.set(cell, count - 1)
                }
                return next
            })
            flashTimersRef.current = flashTimersRef.current.filter(
                (t) => t !== timer,
            )
        }, 700)

        flashTimersRef.current.push(timer)
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
