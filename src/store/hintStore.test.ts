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
    selectCell,
} from "./gameStore"
import { dismissHint, hintState, showHint } from "./hintStore"

beforeEach(() => {
    newGame("easy")
    dismissHint()
})

describe("showHint", () => {
    it("sets hintState.hint to a non-null value", () => {
        showHint()
        expect(hintState.hint).not.toBeNull()
    })

    it("moves selection to the hint cell", () => {
        showHint()
        const hint = hintState.hint
        expect(hint).not.toBeNull()
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
