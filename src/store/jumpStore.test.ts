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
import {
    activate,
    deactivate,
    feedDigit,
    getOverlay,
    handleKey,
    jumpState,
} from "./jumpStore"

function makeKeyEvent(
    overrides: Partial<KeyboardEvent> & { key: string },
): KeyboardEvent {
    return {
        key: overrides.key,
        code: overrides.code ?? "",
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
        ...overrides,
    } as unknown as KeyboardEvent
}

beforeEach(() => {
    newGame("easy")
    deactivate()
})

describe("activate", () => {
    it("sets active to true", () => {
        activate()
        expect(jumpState.active).toBe(true)
        expect(jumpState.firstDigit).toBeNull()
    })
})

describe("deactivate", () => {
    it("resets state", () => {
        activate()
        feedDigit(3)
        deactivate()
        expect(jumpState.active).toBe(false)
        expect(jumpState.firstDigit).toBeNull()
    })
})

describe("feedDigit", () => {
    it("stores first digit and returns null", () => {
        activate()
        const result = feedDigit(3)
        expect(result).toBeNull()
        expect(jumpState.firstDigit).toBe(3)
    })

    it("returns CellPos on second digit and deactivates", () => {
        activate()
        feedDigit(3)
        const result = feedDigit(5)
        expect(result).toEqual({ row: 2, col: 4 })
        expect(jumpState.active).toBe(false)
    })
})

describe("handleKey", () => {
    it("returns true for Space when inactive", () => {
        const e = makeKeyEvent({ key: " ", code: "Space" })
        expect(handleKey(e)).toBe(true)
        expect(jumpState.active).toBe(true)
    })

    it("returns false for other keys when inactive", () => {
        const e = makeKeyEvent({ key: "a", code: "KeyA" })
        expect(handleKey(e)).toBe(false)
    })

    it("does not activate Space when game is won", () => {
        selectCell({ row: 0, col: 0 })
        placeNumber(5)
        selectCell({ row: 0, col: 1 })
        placeNumber(3)
        selectCell({ row: 4, col: 4 })
        placeNumber(5)
        selectCell({ row: 8, col: 8 })
        placeNumber(9)
        expect(computeWon(gameData.value.board, gameUI.solution)).toBe(true)

        const e = makeKeyEvent({ key: " ", code: "Space" })
        expect(handleKey(e)).toBe(false)
        expect(jumpState.active).toBe(false)
    })

    it("returns true for all keys when active", () => {
        activate()
        const e = makeKeyEvent({ key: "a", code: "KeyA" })
        expect(handleKey(e)).toBe(true)
    })

    it("deactivates on Escape", () => {
        activate()
        const e = makeKeyEvent({ key: "Escape", code: "Escape" })
        expect(handleKey(e)).toBe(true)
        expect(jumpState.active).toBe(false)
    })

    it("feeds digits when active", () => {
        activate()
        const e1 = makeKeyEvent({ key: "3", code: "Digit3" })
        expect(handleKey(e1)).toBe(true)
        expect(jumpState.firstDigit).toBe(3)

        const e2 = makeKeyEvent({ key: "5", code: "Digit5" })
        expect(handleKey(e2)).toBe(true)
        expect(jumpState.active).toBe(false)
    })
})

describe("getOverlay", () => {
    it("returns null when inactive", () => {
        expect(getOverlay(0, 0)).toBeNull()
    })

    it("returns label when active with no first digit", () => {
        activate()
        expect(getOverlay(0, 0)).toEqual({ label: "11", dimmed: false })
        expect(getOverlay(8, 8)).toEqual({ label: "99", dimmed: false })
        expect(getOverlay(2, 4)).toEqual({ label: "35", dimmed: false })
    })

    it("returns dimmed for non-matching rows after first digit", () => {
        activate()
        feedDigit(3)
        expect(getOverlay(2, 4)).toEqual({ label: "35", dimmed: false })
        expect(getOverlay(0, 0)).toEqual({ label: "11", dimmed: true })
        expect(getOverlay(8, 8)).toEqual({ label: "99", dimmed: true })
    })
})
