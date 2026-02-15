import { beforeEach, describe, expect, it, vi } from "vitest"

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

vi.mock("../sudoku", async () => {
    const actual =
        await vi.importActual<typeof import("../sudoku")>("../sudoku")
    return {
        ...actual,
        generatePuzzle: () => ({
            puzzle: makePuzzle(),
            solution: SOLUTION.map((r) => [...r]),
        }),
    }
})

import {
    clearCell,
    computeErrors,
    computeWon,
    gameData,
    gameUI,
    moveSelection,
    moveSelectionToBlock,
    newGame,
    placeNumber,
    redo,
    selectCell,
    tickTimer,
    toggleNote,
    toggleNotesMode,
    undo,
} from "./gameStore"

beforeEach(() => {
    newGame("easy")
})

describe("computeErrors", () => {
    it("returns empty set for correct board", () => {
        const errors = computeErrors(SOLUTION, SOLUTION)
        expect(errors.size).toBe(0)
    })

    it("detects errors where board differs from solution", () => {
        const board = SOLUTION.map((r) => [...r])
        board[0][0] = 9
        const errors = computeErrors(board, SOLUTION)
        expect(errors.has("0,0")).toBe(true)
        expect(errors.size).toBe(1)
    })

    it("ignores empty cells", () => {
        const board = SOLUTION.map((r) => [...r])
        board[0][0] = 0
        const errors = computeErrors(board, SOLUTION)
        expect(errors.size).toBe(0)
    })
})

describe("computeWon", () => {
    it("returns true when board matches solution", () => {
        expect(computeWon(SOLUTION, SOLUTION)).toBe(true)
    })

    it("returns false when board has empty cells", () => {
        const board = SOLUTION.map((r) => [...r])
        board[0][0] = 0
        expect(computeWon(board, SOLUTION)).toBe(false)
    })

    it("returns false when board has wrong values", () => {
        const board = SOLUTION.map((r) => [...r])
        board[0][0] = 9
        expect(computeWon(board, SOLUTION)).toBe(false)
    })
})

describe("selectCell", () => {
    it("sets selected cell", () => {
        selectCell({ row: 3, col: 4 })
        expect(gameUI.selected).toEqual({ row: 3, col: 4 })
    })

    it("clears selection with null", () => {
        selectCell({ row: 3, col: 4 })
        selectCell(null)
        expect(gameUI.selected).toBeNull()
    })
})

describe("moveSelection", () => {
    it("initializes to (0,0) when no selection", () => {
        moveSelection(1, 0)
        expect(gameUI.selected).toEqual({ row: 0, col: 0 })
    })

    it("moves by delta", () => {
        selectCell({ row: 4, col: 4 })
        moveSelection(1, 0)
        expect(gameUI.selected).toEqual({ row: 5, col: 4 })
    })

    it("clamps to boundaries", () => {
        selectCell({ row: 0, col: 0 })
        moveSelection(-1, 0)
        expect(gameUI.selected).toEqual({ row: 0, col: 0 })
    })
})

describe("moveSelectionToBlock", () => {
    it("initializes to (0,0) when no selection", () => {
        moveSelectionToBlock(1, 0)
        expect(gameUI.selected).toEqual({ row: 0, col: 0 })
    })

    it("jumps forward to next block boundary", () => {
        selectCell({ row: 0, col: 1 })
        moveSelectionToBlock(0, 1)
        expect(gameUI.selected).toEqual({ row: 0, col: 3 })
    })

    it("jumps backward to previous block boundary", () => {
        selectCell({ row: 4, col: 7 })
        moveSelectionToBlock(-1, -1)
        expect(gameUI.selected).toEqual({ row: 3, col: 6 })
    })

    it("clamps at boundaries", () => {
        selectCell({ row: 0, col: 0 })
        moveSelectionToBlock(-1, -1)
        expect(gameUI.selected).toEqual({ row: 0, col: 0 })

        selectCell({ row: 8, col: 8 })
        moveSelectionToBlock(1, 1)
        expect(gameUI.selected).toEqual({ row: 8, col: 8 })
    })

    it("jumps forward from block boundary", () => {
        selectCell({ row: 4, col: 3 })
        moveSelectionToBlock(0, 1)
        expect(gameUI.selected).toEqual({ row: 4, col: 6 })

        selectCell({ row: 7, col: 6 })
        moveSelectionToBlock(0, 1)
        expect(gameUI.selected).toEqual({ row: 7, col: 8 })
    })

    it("jumps backward from block boundary", () => {
        selectCell({ row: 4, col: 6 })
        moveSelectionToBlock(0, -1)
        expect(gameUI.selected).toEqual({ row: 4, col: 3 })

        selectCell({ row: 4, col: 3 })
        moveSelectionToBlock(0, -1)
        expect(gameUI.selected).toEqual({ row: 4, col: 0 })
    })
})

describe("placeNumber", () => {
    it("places number on empty cell", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.value.board[0][0]).toBe(5)
    })

    it("skips initial cells", () => {
        selectCell({ row: 0, col: 2 })
        placeNumber(1)
        expect(gameData.value.board[0][2]).toBe(4)
    })

    it("skips when no selection", () => {
        placeNumber(5)
        expect(gameData.value.board[0][0]).toBe(0)
    })

    it("skips when game is won", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        selectCell({ row: 0, col: 1 })
        placeNumber(3)
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        selectCell({ row: 8, col: 8 })
        placeNumber(9)
        expect(computeWon(gameData.value.board, gameUI.solution)).toBe(true)
        selectCell({ row: 0, col: 0 })
        placeNumber(1)
        expect(gameData.value.board[0][0]).toBe(5)
    })

    it("clears notes on placed cell and peers", () => {
        selectCell({ row: 0, col: 1 })
        toggleNote(5)
        expect(gameData.value.notes[0][1]).toContain(5)
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.value.notes[0][0]).toEqual([])
        expect(gameData.value.notes[0][1]).not.toContain(5)
    })
})

describe("clearCell", () => {
    it("clears a placed number", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        clearCell()
        expect(gameData.value.board[0][0]).toBe(0)
    })

    it("clears notes", () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(1)
        clearCell()
        expect(gameData.value.notes[0][0]).toEqual([])
    })

    it("skips initial cells", () => {
        selectCell({ row: 0, col: 2 })
        clearCell()
        expect(gameData.value.board[0][2]).toBe(4)
    })
})

describe("toggleNote", () => {
    it("adds a note", () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(3)
        expect(gameData.value.notes[0][0]).toContain(3)
    })

    it("removes existing note", () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(3)
        toggleNote(3)
        expect(gameData.value.notes[0][0]).not.toContain(3)
    })

    it("skips cells with a value", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        toggleNote(1)
        expect(gameData.value.notes[0][0]).toEqual([])
    })

    it("skips initial cells", () => {
        selectCell({ row: 0, col: 2 })
        toggleNote(1)
        expect(gameData.value.notes[0][2]).toEqual([])
    })
})

describe("tickTimer", () => {
    it("increments elapsed", () => {
        const before = gameUI.elapsed
        tickTimer()
        expect(gameUI.elapsed).toBe(before + 1)
    })

    it("stops when won", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        selectCell({ row: 0, col: 1 })
        placeNumber(3)
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        selectCell({ row: 8, col: 8 })
        placeNumber(9)
        const before = gameUI.elapsed
        tickTimer()
        expect(gameUI.elapsed).toBe(before)
    })
})

describe("toggleNotesMode", () => {
    it("toggles notes mode", () => {
        expect(gameUI.notesMode).toBe(false)
        toggleNotesMode()
        expect(gameUI.notesMode).toBe(true)
        toggleNotesMode()
        expect(gameUI.notesMode).toBe(false)
    })
})

describe("newGame", () => {
    it("resets board and UI state", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(9)
        gameUI.elapsed = 42
        newGame("medium")
        expect(gameData.value.board[0][0]).toBe(0)
        expect(gameUI.elapsed).toBe(0)
        expect(gameUI.selected).toBeNull()
        expect(gameUI.difficulty).toBe("medium")
        expect(gameUI.notesMode).toBe(false)
    })

    it("clears undo history", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.isUndoEnabled).toBe(true)
        newGame("easy")
        expect(gameData.isUndoEnabled).toBe(false)
    })
})

describe("undo/redo", () => {
    it("reverts placeNumber", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.value.board[0][0]).toBe(5)
        undo()
        expect(gameData.value.board[0][0]).toBe(0)
    })

    it("redo restores after undo", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        undo()
        expect(gameData.value.board[0][0]).toBe(0)
        redo()
        expect(gameData.value.board[0][0]).toBe(5)
    })

    it("reverts clearCell", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        clearCell()
        expect(gameData.value.board[0][0]).toBe(0)
        undo()
        expect(gameData.value.board[0][0]).toBe(5)
    })

    it("reverts toggleNote", () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(3)
        expect(gameData.value.notes[0][0]).toContain(3)
        undo()
        expect(gameData.value.notes[0][0]).not.toContain(3)
    })

    it("supports multi-step undo", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        selectCell({ row: 0, col: 1 })
        placeNumber(3)
        undo()
        expect(gameData.value.board[0][1]).toBe(0)
        expect(gameData.value.board[0][0]).toBe(5)
        undo()
        expect(gameData.value.board[0][0]).toBe(0)
    })

    it("undo on empty stack is no-op", () => {
        const boardBefore = gameData.value.board.map((r) => [...r])
        undo()
        expect(gameData.value.board.map((r) => [...r])).toEqual(boardBefore)
    })

    it("redo on empty stack is no-op", () => {
        const boardBefore = gameData.value.board.map((r) => [...r])
        redo()
        expect(gameData.value.board.map((r) => [...r])).toEqual(boardBefore)
    })

    it("isUndoEnabled / isRedoEnabled", () => {
        expect(gameData.isUndoEnabled).toBe(false)
        expect(gameData.isRedoEnabled).toBe(false)
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.isUndoEnabled).toBe(true)
        expect(gameData.isRedoEnabled).toBe(false)
        undo()
        expect(gameData.isUndoEnabled).toBe(false)
        expect(gameData.isRedoEnabled).toBe(true)
    })

    it("newGame clears history", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        expect(gameData.isUndoEnabled).toBe(true)
        newGame("easy")
        expect(gameData.isUndoEnabled).toBe(false)
        expect(gameData.isRedoEnabled).toBe(false)
    })
})
