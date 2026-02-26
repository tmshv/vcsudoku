import { describe, expect, it } from "vitest"
import {
    findHiddenSingleInBox,
    findHiddenSingleInColumn,
    findHiddenSingleInRow,
    findNakedSingle,
    getCandidates,
    getHint,
} from "./hint"
import type { Board } from "./sudoku"

// Standard deterministic board used across tests
const SOLUTION: Board = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

function emptyBoard(): Board {
    return Array.from({ length: 9 }, () => Array(9).fill(0))
}

// Returns SOLUTION with the given cells zeroed out
function puzzleWith(empties: [number, number][]): Board {
    const board = SOLUTION.map((r) => [...r])
    for (const [r, c] of empties) {
        board[r][c] = 0
    }
    return board
}

describe("getCandidates", () => {
    it("returns the only valid candidate for a near-full board", () => {
        const board = puzzleWith([[0, 0]])
        // [0][0] solution = 5; everything else in row/col/box is filled
        expect(getCandidates(board, 0, 0)).toEqual([5])
    })

    it("returns empty array for a filled cell", () => {
        const board = SOLUTION.map((r) => [...r])
        expect(getCandidates(board, 0, 0)).toEqual([])
    })

    it("returns all 9 candidates for an isolated empty cell on an empty board", () => {
        const board = emptyBoard()
        expect(getCandidates(board, 4, 4)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
})

describe("findNakedSingle", () => {
    it("returns the correct cell and value when exactly one candidate exists", () => {
        // Only [0][0] is empty; its only candidate is 5
        const board = puzzleWith([[0, 0]])
        const hint = findNakedSingle(board)
        expect(hint).not.toBeNull()
        expect(hint?.cell).toEqual({ row: 0, col: 0 })
        expect(hint?.value).toBe(5)
        expect(hint?.strategy).toBe("naked single")
        expect(hint?.explanation).toContain("5")
    })

    it("returns null when no cell has exactly one candidate", () => {
        // Empty board — every cell has 9 candidates
        const board = emptyBoard()
        expect(findNakedSingle(board)).toBeNull()
    })

    it("returns null for a fully solved board", () => {
        const board = SOLUTION.map((r) => [...r])
        expect(findNakedSingle(board)).toBeNull()
    })
})

describe("findHiddenSingleInRow", () => {
    it("returns the correct cell and value for a digit with one valid row cell", () => {
        // Row 0: only [0][0] is empty, missing digit 5.
        // Digit 5 can only go in [0][0] within row 0.
        const board = puzzleWith([[0, 0]])
        const hint = findHiddenSingleInRow(board)
        expect(hint).not.toBeNull()
        expect(hint?.cell).toEqual({ row: 0, col: 0 })
        expect(hint?.value).toBe(5)
        expect(hint?.strategy).toBe("hidden single in row")
        expect(hint?.explanation).toContain("row 1")
        expect(hint?.explanation).toContain("5")
    })

    it("returns null when no hidden single in any row exists", () => {
        // Fully empty board: every digit can go in all 9 cells of each row
        expect(findHiddenSingleInRow(emptyBoard())).toBeNull()
    })
})

describe("findHiddenSingleInColumn", () => {
    it("returns the correct cell and value for a digit with one valid column cell", () => {
        // Only [0][0] is empty; column 0 is missing digit 5, only valid there.
        const board = puzzleWith([[0, 0]])
        const hint = findHiddenSingleInColumn(board)
        expect(hint).not.toBeNull()
        expect(hint?.cell).toEqual({ row: 0, col: 0 })
        expect(hint?.value).toBe(5)
        expect(hint?.strategy).toBe("hidden single in column")
        expect(hint?.explanation).toContain("column 1")
        expect(hint?.explanation).toContain("5")
    })

    it("returns null when no hidden single in any column exists", () => {
        expect(findHiddenSingleInColumn(emptyBoard())).toBeNull()
    })
})

describe("findHiddenSingleInBox", () => {
    it("returns the correct cell and value for a digit with one valid box cell", () => {
        // Only [0][0] is empty; box 1 (top-left) is missing digit 5, only valid at [0][0].
        const board = puzzleWith([[0, 0]])
        const hint = findHiddenSingleInBox(board)
        expect(hint).not.toBeNull()
        expect(hint?.cell).toEqual({ row: 0, col: 0 })
        expect(hint?.value).toBe(5)
        expect(hint?.strategy).toBe("hidden single in box")
        expect(hint?.explanation).toContain("box 1")
        expect(hint?.explanation).toContain("5")
    })

    it("returns null when no hidden single in any box exists", () => {
        expect(findHiddenSingleInBox(emptyBoard())).toBeNull()
    })
})

describe("getHint", () => {
    it("returns null for a fully solved board", () => {
        const board = SOLUTION.map((r) => [...r])
        expect(getHint(board, SOLUTION)).toBeNull()
    })

    it("uses fallback and returns a hint from solution when no logical strategy applies", () => {
        // Empty board: all strategies return null, fallback uses solution
        const board = emptyBoard()
        const hint = getHint(board, SOLUTION)
        expect(hint).not.toBeNull()
        expect(hint?.strategy).toBe("fallback")
        // Fallback picks first empty cell [0][0], solution value = 5
        expect(hint?.cell).toEqual({ row: 0, col: 0 })
        expect(hint?.value).toBe(SOLUTION[0][0])
        expect(hint?.explanation).toContain("Try placing")
    })

    it("prefers a strategy over fallback when one applies", () => {
        // Near-full board with one empty cell triggers naked single
        const board = puzzleWith([[0, 0]])
        const hint = getHint(board, SOLUTION)
        expect(hint).not.toBeNull()
        expect(hint?.strategy).not.toBe("fallback")
        expect(hint?.value).toBe(5)
    })
})
