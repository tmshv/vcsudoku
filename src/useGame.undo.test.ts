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
        puzzle[0][0] = 0
        puzzle[0][1] = 0
        puzzle[4][4] = 0
        puzzle[8][8] = 0
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

describe("undo/redo via hook", () => {
    it("canUndo is false initially", () => {
        const { result } = renderGame()
        expect(result.current.canUndo).toBe(false)
    })

    it("canRedo is false initially", () => {
        const { result } = renderGame()
        expect(result.current.canRedo).toBe(false)
    })

    it("canUndo becomes true after placing a number", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.canUndo).toBe(true)
    })

    it("canRedo becomes true after undo", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.undo())
        expect(result.current.canRedo).toBe(true)
    })

    it("undo reverts placeNumber", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
        await act(async () => result.current.undo())
        expect(result.current.board[0][0]).toBe(0)
    })

    it("redo restores after undo", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.undo())
        await act(async () => result.current.redo())
        expect(result.current.board[0][0]).toBe(5)
    })
})

describe("undo/redo keyboard shortcuts", () => {
    it("Ctrl+Z triggers undo", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        expect(result.current.board[0][0]).toBe(5)
        await act(async () => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "z", ctrlKey: true }),
            )
        })
        expect(result.current.board[0][0]).toBe(0)
    })

    it("Ctrl+Shift+Z triggers redo", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.undo())
        expect(result.current.board[0][0]).toBe(0)
        await act(async () => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Z",
                    ctrlKey: true,
                    shiftKey: true,
                }),
            )
        })
        expect(result.current.board[0][0]).toBe(5)
    })

    it("Ctrl+Y triggers redo", async () => {
        const { result } = renderGame()
        await act(async () => result.current.selectCell({ row: 0, col: 0 }))
        await act(async () => result.current.placeNumber(5))
        await act(async () => result.current.undo())
        await act(async () => {
            window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "y", ctrlKey: true }),
            )
        })
        expect(result.current.board[0][0]).toBe(5)
    })
})
