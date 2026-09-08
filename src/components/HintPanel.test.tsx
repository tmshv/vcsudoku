import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../sudoku", async () => {
    const actual =
        await vi.importActual<typeof import("../sudoku")>("../sudoku")
    const solution = Array.from({ length: 9 }, (_, row) =>
        Array.from(
            { length: 9 },
            (_, col) => ((row * 3 + Math.floor(row / 3) + col) % 9) + 1,
        ),
    )
    return {
        ...actual,
        generatePuzzle: () => ({
            solution: solution.map((row) => [...row]),
            puzzle: solution.map((row, r) =>
                row.map((value, c) => (r === c ? 0 : value)),
            ),
        }),
    }
})

import App from "../App"
import { findLockedCandidates, getCandidateGrid } from "../hint"
import { deactivate as stopFind } from "../store/findStore"
import { gameData, newGame, selectCell, toggleNote } from "../store/gameStore"
import { dismissHint } from "../store/hintStore"
import { jumpState, deactivate as stopJump } from "../store/jumpStore"
import { Board } from "./Board"

beforeEach(() => {
    newGame("easy")
    dismissHint()
    stopJump()
    stopFind()
})
afterEach(cleanup)

async function click(name: string) {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name }))
    })
}

async function key(value: string) {
    await act(async () => {
        fireEvent.keyDown(window, { key: value })
    })
}

describe("hint interaction in the app", () => {
    it("walks from units to evidence to an undoable placement, without overwriting notes", async () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(9)
        render(<App />)
        const originalNotes = JSON.stringify(gameData.value.notes)
        await click("Hint")
        const panel = screen.getByRole("region", { name: "Sudoku hint" })
        expect(within(panel).getByRole("heading").textContent).toBe(
            "Look at the intersecting units",
        )
        expect(
            within(panel).queryByRole("button", { name: /Place/ }),
        ).toBeNull()
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(21)
        expect(document.querySelectorAll(".cell-hint-evidence")).toHaveLength(0)
        await click("Explain next")
        expect(
            document.querySelectorAll(".cell-hint-evidence").length,
        ).toBeGreaterThan(0)
        expect(JSON.stringify(gameData.value.notes)).toBe(originalNotes)
        await click("Back")
        expect(document.querySelectorAll(".cell-hint-evidence")).toHaveLength(0)
        await key("v")
        await key("v")
        await click("Place 1 in R1C1")
        expect(gameData.value.board[0][0]).toBe(1)
        expect(screen.queryByRole("region", { name: "Sudoku hint" })).toBeNull()
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(0)
        await click("Undo")
        expect(gameData.value.board[0][0]).toBe(0)
        expect(gameData.value.notes[0][0]).toEqual([9])
    })

    it("dismisses by button and Escape, restoring the player's visible notes", async () => {
        selectCell({ row: 0, col: 0 })
        toggleNote(9)
        render(<App />)
        await click("Hint")
        await click("Dismiss hint")
        expect(
            screen.getByRole("button", { name: /R1C1: empty, candidates 9/ }),
        ).toBeDefined()
        await click("Hint")
        await key("Escape")
        expect(screen.queryByRole("region", { name: "Sudoku hint" })).toBeNull()
    })

    it("temporarily suspends the proof during jump and find", async () => {
        render(<App />)
        await click("Hint")
        await key(" ")
        expect(screen.queryByRole("region", { name: "Sudoku hint" })).toBeNull()
        expect(document.querySelectorAll(".cell-overlay")).toHaveLength(81)
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(0)
        await key("Escape")
        expect(
            screen.getByRole("region", { name: "Sudoku hint" }),
        ).toBeDefined()
        await key("f")
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(0)
        await key("Escape")
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(21)
    })

    it("leaves Space on a focused hint button available for native activation", async () => {
        render(<App />)
        await click("Hint")
        const next = screen.getByRole("button", { name: "Explain next" })
        next.focus()
        const event = new KeyboardEvent("keydown", {
            key: " ",
            bubbles: true,
            cancelable: true,
        })
        await act(async () => {
            next.dispatchEvent(event)
        })
        expect(event.defaultPrevented).toBe(false)
        expect(jumpState.active).toBe(false)
    })

    it("keeps the Space shortcut on board cells and opens a visible hint from jump mode", async () => {
        render(<App />)
        const cell = screen.getByRole("button", { name: "R1C1: empty" })
        cell.focus()
        await act(async () => {
            fireEvent.keyDown(cell, { key: " " })
        })
        expect(jumpState.active).toBe(true)
        await click("Hint")
        expect(jumpState.active).toBe(false)
        expect(
            screen.getByRole("region", { name: "Sudoku hint" }),
        ).toBeDefined()
    })

    it("renders crossed-out candidates and the actual intersecting units", () => {
        const board = Array.from({ length: 9 }, () => Array(9).fill(0))
        const grid = getCandidateGrid(board)
        for (let col = 2; col < 9; col++)
            grid[0][col] = grid[0][col].filter((value) => value !== 1)
        const deduction = findLockedCandidates(grid)
        expect(deduction).not.toBeNull()
        render(
            <Board
                board={board}
                initial={board.map((row) => row.map(() => false))}
                selected={null}
                errors={new Set()}
                notes={board.map((row) => row.map(() => []))}
                onSelectCell={vi.fn()}
                hintStep={deduction?.steps[1]}
            />,
        )
        expect(document.querySelectorAll(".note-eliminated")).toHaveLength(
            deduction?.eliminations.length ?? 0,
        )
        expect(document.querySelectorAll(".cell-hint-focus")).toHaveLength(2)
        expect(document.querySelectorAll(".cell-hint-unit")).toHaveLength(15)
        expect(document.querySelectorAll(".note-match")).toHaveLength(2)
        expect(
            screen.getAllByRole("button", { name: /exclude 1/ }).length,
        ).toBeGreaterThan(0)
    })
})
