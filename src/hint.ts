import { type Board, isValidPlacement } from "./sudoku"

export interface Hint {
    cell: { row: number; col: number }
    value: number
    strategy: string
    explanation: string
}

export function getCandidates(
    board: Board,
    row: number,
    col: number,
): number[] {
    if (board[row][col] !== 0) return []
    const candidates: number[] = []
    for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(board, row, col, num)) {
            candidates.push(num)
        }
    }
    return candidates
}

export function findNakedSingle(board: Board): Hint | null {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== 0) continue
            const candidates = getCandidates(board, r, c)
            if (candidates.length === 1) {
                const value = candidates[0]
                return {
                    cell: { row: r, col: c },
                    value,
                    strategy: "naked single",
                    explanation: `Only ${value} fits here — its row, column, and box each already contain all other digits.`,
                }
            }
        }
    }
    return null
}

export function findHiddenSingleInRow(board: Board): Hint | null {
    for (let r = 0; r < 9; r++) {
        for (let num = 1; num <= 9; num++) {
            const validCols: number[] = []
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0 && isValidPlacement(board, r, c, num)) {
                    validCols.push(c)
                }
            }
            if (validCols.length === 1) {
                const c = validCols[0]
                return {
                    cell: { row: r, col: c },
                    value: num,
                    strategy: "hidden single in row",
                    explanation: `${num} can only go in this cell in row ${r + 1} — all other empty cells in row ${r + 1} conflict with ${num}.`,
                }
            }
        }
    }
    return null
}

export function findHiddenSingleInColumn(board: Board): Hint | null {
    for (let c = 0; c < 9; c++) {
        for (let num = 1; num <= 9; num++) {
            const validRows: number[] = []
            for (let r = 0; r < 9; r++) {
                if (board[r][c] === 0 && isValidPlacement(board, r, c, num)) {
                    validRows.push(r)
                }
            }
            if (validRows.length === 1) {
                const r = validRows[0]
                return {
                    cell: { row: r, col: c },
                    value: num,
                    strategy: "hidden single in column",
                    explanation: `${num} can only go in this cell in column ${c + 1} — all other empty cells in column ${c + 1} conflict with ${num}.`,
                }
            }
        }
    }
    return null
}

export function findHiddenSingleInBox(board: Board): Hint | null {
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const boxNumber = boxRow * 3 + boxCol + 1
            for (let num = 1; num <= 9; num++) {
                const validCells: { row: number; col: number }[] = []
                for (let dr = 0; dr < 3; dr++) {
                    for (let dc = 0; dc < 3; dc++) {
                        const r = boxRow * 3 + dr
                        const c = boxCol * 3 + dc
                        if (
                            board[r][c] === 0 &&
                            isValidPlacement(board, r, c, num)
                        ) {
                            validCells.push({ row: r, col: c })
                        }
                    }
                }
                if (validCells.length === 1) {
                    const cell = validCells[0]
                    return {
                        cell,
                        value: num,
                        strategy: "hidden single in box",
                        explanation: `${num} can only go in this cell in box ${boxNumber} — all other empty cells in this box conflict with ${num}.`,
                    }
                }
            }
        }
    }
    return null
}

export function getHint(board: Board, solution: Board): Hint | null {
    // Check if board is already fully solved
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                // There are empty cells, proceed with strategies
                const hint =
                    findNakedSingle(board) ??
                    findHiddenSingleInRow(board) ??
                    findHiddenSingleInColumn(board) ??
                    findHiddenSingleInBox(board)
                if (hint) return hint

                // Fallback: use solution
                const value = solution[r][c]
                return {
                    cell: { row: r, col: c },
                    value,
                    strategy: "fallback",
                    explanation: `Try placing ${value} here.`,
                }
            }
        }
    }
    return null
}
