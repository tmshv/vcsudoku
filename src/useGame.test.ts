import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// A known valid solved board for deterministic tests
const SOLUTION: number[][] = [
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

function makePuzzle() {
    // Remove a few cells to create a puzzle
    const puzzle = SOLUTION.map((r) => [...r])
    // Clear some non-initial cells for testing
    puzzle[0][0] = 0 // solution = 5
    puzzle[0][1] = 0 // solution = 3
    puzzle[4][4] = 0 // solution = 5
    puzzle[8][8] = 0 // solution = 9
    return puzzle
}

vi.mock("./sudoku", async () => {
    const actual = await vi.importActual<typeof import("./sudoku")>("./sudoku")
    return {
        ...actual,
        generatePuzzle: () => ({
            puzzle: makePuzzle(),
            solution: SOLUTION.map((r) => [...r]),
        }),
    }
})

import { useGame } from "./useGame"

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

function renderGame() {
    return renderHook(() => useGame())
}

describe("selectCell", () => {
    it("selecting a cell updates selected", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 2, col: 3 }))
        expect(result.current.selected).toEqual({ row: 2, col: 3 })
    })

    it("selecting null deselects", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 2, col: 3 }))
        act(() => result.current.selectCell(null))
        expect(result.current.selected).toBeNull()
    })
})

describe("placeNumber", () => {
    it("places number on empty non-initial cell", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
    })

    it("skips placement on initial cells", () => {
        const { result } = renderGame()
        // (0,2) is initial (value=4)
        act(() => result.current.selectCell({ row: 0, col: 2 }))
        act(() => result.current.placeNumber(1))
        expect(result.current.board[0][2]).toBe(4)
    })

    it("skips placement when game is won", () => {
        const { result } = renderGame()
        // Fill all empty cells with correct values to win
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        act(() => result.current.selectCell({ row: 0, col: 1 }))
        act(() => result.current.placeNumber(3))
        act(() => result.current.selectCell({ row: 4, col: 4 }))
        act(() => result.current.placeNumber(5))
        act(() => result.current.selectCell({ row: 8, col: 8 }))
        act(() => result.current.placeNumber(9))
        expect(result.current.won).toBe(true)
        // Now try to place a number — should be ignored
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(1))
        expect(result.current.board[0][0]).toBe(5)
    })

    it("marks error when placed number does not match solution", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(9)) // wrong, solution is 5
        expect(result.current.errors.has("0,0")).toBe(true)
    })

    it("clears error when correct number replaces wrong one", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(9))
        expect(result.current.errors.has("0,0")).toBe(true)
        act(() => result.current.placeNumber(5))
        expect(result.current.errors.has("0,0")).toBe(false)
    })

    it("clears the cell's notes on placement", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.toggleNote(1))
        act(() => result.current.toggleNote(2))
        expect(result.current.notes[0][0].size).toBe(2)
        act(() => result.current.placeNumber(5))
        expect(result.current.notes[0][0].size).toBe(0)
    })

    it("removes placed number from notes of peers (same row, col, box)", () => {
        const { result } = renderGame()
        // Add note 5 to another empty cell in the same row (0,1)
        act(() => result.current.selectCell({ row: 0, col: 1 }))
        act(() => result.current.toggleNote(5))
        expect(result.current.notes[0][1].has(5)).toBe(true)
        // Place 5 at (0,0) — same row
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        expect(result.current.notes[0][1].has(5)).toBe(false)
    })
})

describe("clearCell", () => {
    it("clears a placed number", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
        act(() => result.current.clearCell())
        expect(result.current.board[0][0]).toBe(0)
    })

    it("clears the cell's notes", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.toggleNote(1))
        expect(result.current.notes[0][0].size).toBe(1)
        act(() => result.current.clearCell())
        expect(result.current.notes[0][0].size).toBe(0)
    })

    it("skips initial cells", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 2 }))
        act(() => result.current.clearCell())
        expect(result.current.board[0][2]).toBe(4)
    })

    it("recalculates errors after clearing", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(9)) // wrong
        expect(result.current.errors.has("0,0")).toBe(true)
        act(() => result.current.clearCell())
        expect(result.current.errors.has("0,0")).toBe(false)
    })
})

describe("toggleNote", () => {
    it("adds a note to an empty cell", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.toggleNote(3))
        expect(result.current.notes[0][0].has(3)).toBe(true)
    })

    it("removes a note that already exists", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.toggleNote(3))
        act(() => result.current.toggleNote(3))
        expect(result.current.notes[0][0].has(3)).toBe(false)
    })

    it("skips initial cells", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 2 }))
        act(() => result.current.toggleNote(1))
        expect(result.current.notes[0][2].size).toBe(0)
    })

    it("skips cells that have a placed value", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        act(() => result.current.toggleNote(1))
        expect(result.current.notes[0][0].size).toBe(0)
    })
})

describe("moveSelection (via keyboard)", () => {
    function pressKey(key: string) {
        act(() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key }))
        })
    }

    it("moves selection by delta", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 4, col: 4 }))
        pressKey("ArrowDown")
        expect(result.current.selected).toEqual({ row: 5, col: 4 })
    })

    it("clamps to board boundaries", () => {
        const { result } = renderGame()
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        pressKey("ArrowUp")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
        pressKey("ArrowLeft")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
    })

    it("creates selection at (0,0) when nothing selected", () => {
        const { result } = renderGame()
        expect(result.current.selected).toBeNull()
        pressKey("ArrowDown")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
    })
})

describe("newGame", () => {
    it("resets board, notes, errors, won state", () => {
        const { result } = renderGame()
        // Make some changes
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(9)) // wrong
        expect(result.current.errors.size).toBeGreaterThan(0)
        act(() => result.current.newGame("medium"))
        expect(result.current.errors.size).toBe(0)
        expect(result.current.won).toBe(false)
        expect(result.current.selected).toBeNull()
    })

    it("resets elapsed to 0", () => {
        const { result } = renderGame()
        act(() => {
            vi.advanceTimersByTime(3000)
        })
        expect(result.current.elapsed).toBe(3)
        act(() => result.current.newGame("easy"))
        expect(result.current.elapsed).toBe(0)
    })
})

describe("win condition", () => {
    it("detects win when all cells match solution", () => {
        const { result } = renderGame()
        expect(result.current.won).toBe(false)
        act(() => result.current.selectCell({ row: 0, col: 0 }))
        act(() => result.current.placeNumber(5))
        act(() => result.current.selectCell({ row: 0, col: 1 }))
        act(() => result.current.placeNumber(3))
        act(() => result.current.selectCell({ row: 4, col: 4 }))
        act(() => result.current.placeNumber(5))
        act(() => result.current.selectCell({ row: 8, col: 8 }))
        act(() => result.current.placeNumber(9))
        expect(result.current.won).toBe(true)
    })
})
