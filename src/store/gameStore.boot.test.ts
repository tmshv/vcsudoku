import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Difficulty } from "../sudoku"

const { SOLUTION, requested } = vi.hoisted(() => {
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
    const requested: string[] = []
    return { SOLUTION, requested }
})

vi.mock("../sudoku", async () => {
    const actual =
        await vi.importActual<typeof import("../sudoku")>("../sudoku")
    return {
        ...actual,
        generatePuzzle: (difficulty: Difficulty) => {
            requested.push(difficulty)
            const puzzle = SOLUTION.map((r) => [...r])
            puzzle[0][0] = 0
            return { puzzle, solution: SOLUTION.map((r) => [...r]) }
        },
    }
})

beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    requested.length = 0
})

describe("gameStore boot", () => {
    it("deals the first puzzle at the persisted difficulty", async () => {
        localStorage.setItem(
            "vcsudoku-settings",
            JSON.stringify({ difficulty: "expert" }),
        )
        const { gameUI } = await import("./gameStore")
        expect(requested[0]).toBe("expert")
        expect(gameUI.difficulty).toBe("expert")
    })

    it("deals the first puzzle at 'easy' when nothing is persisted", async () => {
        const { gameUI } = await import("./gameStore")
        expect(requested[0]).toBe("easy")
        expect(gameUI.difficulty).toBe("easy")
    })
})
