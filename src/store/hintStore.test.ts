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
        puzzle[0][0] = 0
        puzzle[0][1] = 0
        puzzle[4][4] = 0
        puzzle[8][8] = 0
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
    computeWon,
    gameData,
    gameUI,
    newGame,
    placeNumber,
    redo,
    selectCell,
    toggleNote,
    undo,
} from "./gameStore"
import {
    applyHint,
    dismissHint,
    hintState,
    nextHintStep,
    previousHintStep,
    revealAnswer,
    showHint,
} from "./hintStore"

beforeEach(() => {
    newGame("easy")
    dismissHint()
})

describe("showHint", () => {
    it("sets hintState.hint to a non-null value", () => {
        showHint()
        expect(hintState.hint).not.toBeNull()
    })

    it("keeps selection until the conclusion, then selects the move", () => {
        selectCell({ row: 8, col: 8 })
        showHint()
        const hint = hintState.hint
        expect(hint).not.toBeNull()
        expect(gameUI.selected).toEqual({ row: 8, col: 8 })
        nextHintStep()
        nextHintStep()
        expect(gameUI.selected).toEqual(hint?.cell)
    })

    it("is a no-op when the game is won", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        selectCell({ row: 0, col: 1 })
        placeNumber(3)
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        selectCell({ row: 8, col: 8 })
        placeNumber(9)
        expect(computeWon(gameData.value.board, gameUI.solution)).toBe(true)

        showHint()
        expect(hintState.hint).toBeNull()
    })
})

describe("walkthrough lifecycle", () => {
    it("advances on repeated hint requests and can step back", () => {
        showHint()
        showHint()
        expect(hintState.step).toBe(1)
        showHint()
        showHint()
        expect(hintState.step).toBe(2)
        previousHintStep()
        expect(hintState.step).toBe(1)
    })

    it("only applies a revealed conclusion, with peer note cleanup and undo/redo", () => {
        selectCell({ row: 0, col: 1 })
        toggleNote(5)
        showHint()
        applyHint()
        expect(gameData.value.board[0][0]).toBe(0)
        nextHintStep()
        nextHintStep()
        applyHint()
        expect(gameData.value.board[0][0]).toBe(5)
        expect(gameData.value.notes[0][1]).toEqual([])
        expect(hintState.hint).toBeNull()
        undo()
        expect(gameData.value.board[0][0]).toBe(0)
        expect(gameData.value.notes[0][1]).toEqual([5])
        redo()
        expect(gameData.value.board[0][0]).toBe(5)
    })

    it("keeps the walkthrough when notes or selection change", () => {
        showHint()
        nextHintStep()
        selectCell({ row: 4, col: 4 })
        toggleNote(1)
        expect(hintState.hint).not.toBeNull()
        expect(hintState.step).toBe(1)
    })

    it("invalidates synchronously on a move so stale hints cannot apply", () => {
        showHint()
        nextHintStep()
        nextHintStep()
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        applyHint()
        expect(hintState.hint).toBeNull()
        expect(gameData.value.board[0][0]).toBe(0)
    })

    it("closes on new game, including a puzzle with identical digits", () => {
        showHint()
        newGame("easy")
        expect(hintState.hint).toBeNull()
    })

    it("closes on undo and redo", () => {
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        showHint()
        undo()
        expect(hintState.hint).toBeNull()
        showHint()
        redo()
        expect(hintState.hint).toBeNull()
    })

    it("offers a clearly labeled, explicit reveal when logic is exhausted", () => {
        gameData.value.board = Array.from({ length: 9 }, () => Array(9).fill(0))
        gameUI.initial = Array.from({ length: 9 }, () => Array(9).fill(false))
        selectCell({ row: 4, col: 4 })
        showHint()
        expect(hintState.hint?.kind).toBe("stuck")
        applyHint()
        expect(gameData.value.board[4][4]).toBe(0)
        revealAnswer()
        expect(hintState.hint?.kind).toBe("reveal")
        expect(gameData.value.board[4][4]).toBe(0)
        applyHint()
        expect(gameData.value.board[4][4]).toBe(5)
    })

    it("never applies or reveals an answer over a conflict", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(6)
        showHint()
        expect(hintState.hint?.kind).toBe("conflict")
        revealAnswer()
        applyHint()
        expect(gameData.value.board[0][0]).toBe(6)
        expect(hintState.hint?.kind).toBe("conflict")
    })
})

describe("dismissHint", () => {
    it("clears hintState.hint", () => {
        showHint()
        expect(hintState.hint).not.toBeNull()
        dismissHint()
        expect(hintState.hint).toBeNull()
    })
})

describe("auto-dismiss on board change", () => {
    it("dismisses hint when a number is placed", async () => {
        showHint()
        expect(hintState.hint).not.toBeNull()

        selectCell({ row: 0, col: 0 })
        placeNumber(5)

        await Promise.resolve()
        expect(hintState.hint).toBeNull()
    })
})
