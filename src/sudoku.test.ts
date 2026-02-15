import { describe, expect, it } from "vitest"
import {
    type Board,
    findEmptyCell,
    findMrvCell,
    generatePuzzle,
    generateSolvedBoard,
    hasUniqueSolution,
    isValidPlacement,
    solve,
} from "./sudoku"

function emptyBoard(): Board {
    return Array.from({ length: 9 }, () => Array(9).fill(0))
}

function isValidBoard(board: Board): boolean {
    for (let r = 0; r < 9; r++) {
        const row = new Set(board[r])
        if (row.size !== 9 || row.has(0)) return false
    }
    for (let c = 0; c < 9; c++) {
        const col = new Set<number>()
        for (let r = 0; r < 9; r++) col.add(board[r][c])
        if (col.size !== 9 || col.has(0)) return false
    }
    for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
            const box = new Set<number>()
            for (let r = br * 3; r < br * 3 + 3; r++) {
                for (let c = bc * 3; c < bc * 3 + 3; c++) {
                    box.add(board[r][c])
                }
            }
            if (box.size !== 9 || box.has(0)) return false
        }
    }
    return true
}

describe("findEmptyCell", () => {
    it("returns [0, 0] for a fully empty board", () => {
        const board = emptyBoard()
        expect(findEmptyCell(board)).toEqual([0, 0])
    })

    it("returns null for a fully filled board", () => {
        const board = generateSolvedBoard()
        expect(findEmptyCell(board)).toBeNull()
    })

    it("returns the first empty cell scanning row by row", () => {
        const board = generateSolvedBoard()
        board[3][5] = 0
        board[7][2] = 0
        expect(findEmptyCell(board)).toEqual([3, 5])
    })

    it("skips filled cells and finds the only empty one", () => {
        const board = generateSolvedBoard()
        board[8][8] = 0
        expect(findEmptyCell(board)).toEqual([8, 8])
    })
})

describe("findMrvCell", () => {
    it("returns null for a fully filled board", () => {
        const board = generateSolvedBoard()
        expect(findMrvCell(board)).toBeNull()
    })

    it("returns the only empty cell when one cell is empty", () => {
        const board = generateSolvedBoard()
        board[4][6] = 0
        expect(findMrvCell(board)).toEqual([4, 6])
    })

    it("picks the cell with fewest candidates", () => {
        const board = emptyBoard()
        // Fill row 0 except columns 0 and 8
        // Row 0: [0, 2, 3, 4, 5, 6, 7, 8, 0]
        board[0][1] = 2
        board[0][2] = 3
        board[0][3] = 4
        board[0][4] = 5
        board[0][5] = 6
        board[0][6] = 7
        board[0][7] = 8
        // (0,0) candidates: 1, 9  (2 candidates)
        // (0,8) candidates: 1, 9  (2 candidates) — same so far
        // Add 1 in column 0 to further constrain (0,0) to just {9}
        board[1][0] = 1
        // Now (0,0) has only candidate 9 → 1 candidate
        // (0,8) still has candidates 1 and 9 → 2 candidates
        const result = findMrvCell(board)
        expect(result).toEqual([0, 0])
    })

    it("early-returns a cell with zero candidates", () => {
        const board = emptyBoard()
        // Make (0,0) have zero candidates by putting 1-9 in its row
        board[0][1] = 1
        board[0][2] = 2
        board[0][3] = 3
        board[0][4] = 4
        board[0][5] = 5
        board[0][6] = 6
        board[0][7] = 7
        board[0][8] = 8
        board[1][0] = 9 // blocks 9 via column
        const result = findMrvCell(board)
        expect(result).toEqual([0, 0])
    })
})

describe("isValidPlacement", () => {
    it("returns true for valid placement on empty board", () => {
        const board = emptyBoard()
        expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
    })

    it("returns false when same number exists in row", () => {
        const board = emptyBoard()
        board[0][4] = 5
        expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it("returns false when same number exists in column", () => {
        const board = emptyBoard()
        board[4][0] = 5
        expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it("returns false when same number exists in 3x3 box", () => {
        const board = emptyBoard()
        board[1][1] = 5
        expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
    })

    it("returns true when same number is in different box/row/col", () => {
        const board = emptyBoard()
        board[3][3] = 5
        expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
    })
})

describe("solve", () => {
    it("solves an empty board to a complete valid 9x9 board", () => {
        const board = emptyBoard()
        const result = solve(board)
        expect(result).not.toBeNull()
        // biome-ignore lint/style/noNonNullAssertion: asserted not null above
        expect(isValidBoard(result!)).toBe(true)
    })

    it("solves a partial board correctly", () => {
        const board = emptyBoard()
        board[0][0] = 5
        board[0][1] = 3
        board[1][0] = 6
        const result = solve(board)
        expect(result).not.toBeNull()
        // biome-ignore lint/style/noNonNullAssertion: asserted not null above
        expect(isValidBoard(result!)).toBe(true)
        // biome-ignore lint/style/noNonNullAssertion: asserted not null above
        expect(result![0][0]).toBe(5)
        // biome-ignore lint/style/noNonNullAssertion: asserted not null above
        expect(result![0][1]).toBe(3)
        // biome-ignore lint/style/noNonNullAssertion: asserted not null above
        expect(result![1][0]).toBe(6)
    })

    it("returns null for an unsolvable board", () => {
        const board = emptyBoard()
        // Fill box 0 so only 9 can go at (2,2), then block 9 via row and column
        board[0][0] = 1
        board[0][1] = 2
        board[0][2] = 3
        board[1][0] = 4
        board[1][1] = 5
        board[1][2] = 6
        board[2][0] = 7
        board[2][1] = 8
        board[3][2] = 9 // blocks 9 in column 2
        board[2][3] = 9 // blocks 9 in row 2
        // Cell (2,2) has no valid digit → unsolvable
        const result = solve(board)
        expect(result).toBeNull()
    })

    it("with randomize=false, digit order is deterministic", () => {
        const board1 = emptyBoard()
        const board2 = emptyBoard()
        const result1 = solve(board1, false)
        const result2 = solve(board2, false)
        expect(result1).toEqual(result2)
    })
})

describe("generateSolvedBoard", () => {
    it("returns a 9x9 board with no zeros", () => {
        const board = generateSolvedBoard()
        expect(board.length).toBe(9)
        for (const row of board) {
            expect(row.length).toBe(9)
            for (const val of row) {
                expect(val).toBeGreaterThanOrEqual(1)
                expect(val).toBeLessThanOrEqual(9)
            }
        }
    })

    it("every row/col/box has digits 1-9 exactly once", () => {
        const board = generateSolvedBoard()
        expect(isValidBoard(board)).toBe(true)
    })
})

describe("generatePuzzle", () => {
    it("easy: puzzle has at least 43 filled cells", () => {
        const { puzzle } = generatePuzzle("easy")
        const filled = puzzle.flat().filter((v) => v !== 0).length
        expect(filled).toBeGreaterThanOrEqual(81 - 38)
    })

    it("medium: puzzle has at least 35 filled cells", () => {
        const { puzzle } = generatePuzzle("medium")
        const filled = puzzle.flat().filter((v) => v !== 0).length
        expect(filled).toBeGreaterThanOrEqual(81 - 46)
    })

    it("hard: puzzle has at least 28 filled cells", () => {
        const { puzzle } = generatePuzzle("hard")
        const filled = puzzle.flat().filter((v) => v !== 0).length
        expect(filled).toBeGreaterThanOrEqual(81 - 53)
    })

    it("solution is a valid complete board", () => {
        const { solution } = generatePuzzle("easy")
        expect(isValidBoard(solution)).toBe(true)
    })

    it("puzzle has a unique solution", () => {
        const { puzzle } = generatePuzzle("easy")
        expect(hasUniqueSolution(puzzle)).toBe(true)
    })

    it("puzzle filled cells match solution at those positions", () => {
        const { puzzle, solution } = generatePuzzle("medium")
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (puzzle[r][c] !== 0) {
                    expect(puzzle[r][c]).toBe(solution[r][c])
                }
            }
        }
    })
})
