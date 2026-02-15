import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { SOLUTION, makePuzzle } = vi.hoisted(() => {
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
        const puzzle = SOLUTION.map((r) => [...r])
        puzzle[0][0] = 0 // solution = 5
        puzzle[0][1] = 0 // solution = 3
        puzzle[4][4] = 0 // solution = 5
        puzzle[8][8] = 0 // solution = 9
        return puzzle
    }
    return { SOLUTION, makePuzzle }
})

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

import { newGame } from "./store/gameStore"
import { useGame } from "./useGame"

beforeEach(async () => {
    vi.useFakeTimers()
    await act(async () => newGame("easy"))
})

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

function renderGame() {
    return renderHook(() => useGame())
}

describe("selectCell", () => {
    it("selecting a cell updates selected", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 2, col: 3 }))
        expect(result.current.selected).toEqual({ row: 2, col: 3 })
    })

    it("selecting null deselects", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 2, col: 3 }))
        await act(async () => result.current.selectCell(null))
        expect(result.current.selected).toBeNull()
    })
})

describe("placeNumber", () => {
    it("places number on empty non-initial cell", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
    })

    it("skips placement on initial cells", async () => {
        const { result } = renderGame()
        // (0,2) is initial (value=4)
        await act(async () => result.current.selectCell({ row: 0, col: 2 }))
        await act(async () => result.current.placeNumber(1))
        expect(result.current.board[0][2]).toBe(4)
    })

    it("skips placement when game is won", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.selectCell({ row: 0, col: 1 }))
        await act(async () => result.current.placeNumber(3))
        await act(async () => result.current.selectCell({ row: 4, col: 4 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.selectCell({ row: 8, col: 8 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.won).toBe(true)
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(1))
        expect(result.current.board[0][0]).toBe(5)
    })

    it("marks error when placed number does not match solution", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.errors.has("0,0")).toBe(true)
    })

    it("clears error when correct number replaces wrong one", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.errors.has("0,0")).toBe(true)
        await act(async () => result.current.placeNumber(5))
        expect(result.current.errors.has("0,0")).toBe(false)
    })

    it("clears the cell's notes on placement", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.toggleNote(1))
        await act(async () => result.current.toggleNote(2))
        expect(result.current.notes[0][0].length).toBe(2)
        await act(async () => result.current.placeNumber(5))
        expect(result.current.notes[0][0].length).toBe(0)
    })

    it("removes placed number from notes of peers (same row, col, box)", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 1 }))
        await act(async () => result.current.toggleNote(5))
        expect(result.current.notes[0][1].includes(5)).toBe(true)
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.notes[0][1].includes(5)).toBe(false)
    })
})

describe("clearCell", () => {
    it("clears a placed number", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
        await act(async () => result.current.clearCell())
        expect(result.current.board[0][0]).toBe(0)
    })

    it("clears the cell's notes", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.toggleNote(1))
        expect(result.current.notes[0][0].length).toBe(1)
        await act(async () => result.current.clearCell())
        expect(result.current.notes[0][0].length).toBe(0)
    })

    it("skips initial cells", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 2 }))
        await act(async () => result.current.clearCell())
        expect(result.current.board[0][2]).toBe(4)
    })

    it("recalculates errors after clearing", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.errors.has("0,0")).toBe(true)
        await act(async () => result.current.clearCell())
        expect(result.current.errors.has("0,0")).toBe(false)
    })
})

describe("toggleNote", () => {
    it("adds a note to an empty cell", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.toggleNote(3))
        expect(result.current.notes[0][0].includes(3)).toBe(true)
    })

    it("removes a note that already exists", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.toggleNote(3))
        await act(async () => result.current.toggleNote(3))
        expect(result.current.notes[0][0].includes(3)).toBe(false)
    })

    it("skips initial cells", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 2 }))
        await act(async () => result.current.toggleNote(1))
        expect(result.current.notes[0][2].length).toBe(0)
    })

    it("skips cells that have a placed value", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.toggleNote(1))
        expect(result.current.notes[0][0].length).toBe(0)
    })
})

describe("moveSelection (via keyboard)", () => {
    async function pressKey(key: string) {
        await act(async () => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key }))
        })
    }

    it("moves selection by delta", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 4, col: 4 }))
        await pressKey("ArrowDown")
        expect(result.current.selected).toEqual({ row: 5, col: 4 })
    })

    it("clamps to board boundaries", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await pressKey("ArrowUp")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
        await pressKey("ArrowLeft")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
    })

    it("creates selection at (0,0) when nothing selected", async () => {
        const { result } = renderGame()
        expect(result.current.selected).toBeNull()
        await pressKey("ArrowDown")
        expect(result.current.selected).toEqual({ row: 0, col: 0 })
    })
})

describe("newGame", () => {
    it("resets board, notes, errors, won state", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.errors.size).toBeGreaterThan(0)
        await act(async () => result.current.newGame("medium"))
        expect(result.current.errors.size).toBe(0)
        expect(result.current.won).toBe(false)
        expect(result.current.selected).toBeNull()
    })

    it("resets elapsed to 0", async () => {
        const { result } = renderGame()
        await act(async () => {
            vi.advanceTimersByTime(3000)
        })
        expect(result.current.elapsed).toBe(3)
        await act(async () => result.current.newGame("easy"))
        expect(result.current.elapsed).toBe(0)
    })
})

describe("win condition", () => {
    it("detects win when all cells match solution", async () => {
        const { result } = renderGame()
        expect(result.current.won).toBe(false)
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.selectCell({ row: 0, col: 1 }))
        await act(async () => result.current.placeNumber(3))
        await act(async () => result.current.selectCell({ row: 4, col: 4 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.selectCell({ row: 8, col: 8 }))
        await act(async () => result.current.placeNumber(9))
        expect(result.current.won).toBe(true)
    })
})
