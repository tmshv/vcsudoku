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
