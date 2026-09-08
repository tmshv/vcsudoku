import { describe, expect, it } from "vitest"
import {
    type CandidateGrid,
    findHiddenSingleInBox,
    findHiddenSingleInColumn,
    findHiddenSingleInRow,
    findLockedCandidates,
    findNakedSingle,
    findSubset,
    findXWing,
    getCandidateGrid,
    getCandidates,
    getHint,
    revealHint,
} from "./hint"
import { type Board, findMrvCell, isValidPlacement } from "./sudoku"

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

    it("reports the technique limit without disguising a solution reveal as logic", () => {
        const board = emptyBoard()
        const hint = getHint(board, SOLUTION)
        expect(hint?.kind).toBe("stuck")
        expect(hint?.cell).toBeUndefined()
        expect(hint?.value).toBeUndefined()
        expect(hint?.explanation).toContain(
            "does not mean the puzzle requires guessing",
        )
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

describe("proofs and invalid boards", () => {
    it("derives a move without a saved solution and explains the combined peers", () => {
        const hint = getHint(puzzleWith([[0, 0]]))
        expect(hint?.value).toBe(5)
        expect(hint?.steps).toHaveLength(3)
        expect(hint?.steps[0].candidates).toEqual([])
        expect(hint?.steps[1].units.map((unit) => unit.type)).toEqual([
            "row",
            "column",
            "box",
        ])
        expect(hint?.steps[1].evidence).toContainEqual({ row: 0, col: 1 })
        expect(hint?.explanation).toContain("together")
    })

    it("shows the blocking digits and crossing units of a real hidden single", () => {
        const board = emptyBoard()
        board[3][0] = 1
        board[6][1] = 1
        board[1][3] = 1
        const hint = findHiddenSingleInBox(board)
        expect(hint).toBeNull()
        // Block row 1 too, leaving only R3C3 for 1 in box 1.
        board[0][6] = 1
        const forced = findHiddenSingleInBox(board)
        expect(forced?.cell).toEqual({ row: 2, col: 2 })
        expect(forced?.steps[1].evidence).toContainEqual({ row: 3, col: 0 })
        expect(forced?.steps[1].excluded).toHaveLength(8)
        expect(forced?.steps[1].units).toContainEqual({
            type: "column",
            index: 0,
        })
        expect(getCandidates(board, 2, 2).length).toBeGreaterThan(1)
    })

    it("reports duplicate digits even on a full board", () => {
        const board = SOLUTION.map((row) => [...row])
        board[0][0] = 3
        const hint = getHint(board, SOLUTION)
        expect(hint?.kind).toBe("conflict")
        expect(hint?.value).toBeUndefined()
        expect(hint?.steps[0].evidence).toEqual([
            { row: 0, col: 0 },
            { row: 0, col: 1 },
        ])
    })

    it("detects a cell with zero candidates before suggesting a placement", () => {
        const board = emptyBoard()
        board[0] = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        board[1][0] = 9
        expect(getHint(board)?.strategy).toBe("No candidates")
    })

    it("detects a missing unit position even when all empty cells have candidates", () => {
        const board = emptyBoard()
        board[0] = [0, 0, 1, 2, 3, 4, 5, 6, 7]
        board[3][0] = 9
        board[6][1] = 9
        expect(getHint(board)?.strategy).toBe("Missing position")
    })

    it("labels nonconflicting wrong entries as a solution check", () => {
        const board = emptyBoard()
        board[0][0] = 1
        const hint = getHint(board, SOLUTION)
        expect(hint?.kind).toBe("conflict")
        expect(hint?.explanation).toContain("solution check")
        expect(hint?.value).toBeUndefined()
    })

    it("reveals a selected answer only through the separate reveal function", () => {
        const hint = revealHint(emptyBoard(), SOLUTION, { row: 4, col: 4 })
        expect(hint?.kind).toBe("reveal")
        expect(hint?.value).toBe(5)
        expect(hint?.explanation).toContain("not a logical deduction")
        expect(revealHint(SOLUTION, SOLUTION)).toBeNull()
    })
})

// Artificial candidate fixtures isolate a technique from simpler moves.
function candidateFixture(
    entries: [number, number, number[]][],
): CandidateGrid {
    const grid: CandidateGrid = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => []),
    )
    for (const [row, col, values] of entries) grid[row][col] = values
    return grid
}

function transpose(grid: CandidateGrid): CandidateGrid {
    return grid.map((_, row) => grid.map((line) => [...line[row]]))
}

describe("candidate elimination techniques", () => {
    it.each([false, true])(
        "finds pointing candidates (transposed: %s)",
        (flipped) => {
            let grid = candidateFixture([
                [0, 0, [1]],
                [0, 1, [1]],
                [0, 4, [1]],
                [3, 4, [1]],
                [3, 0, [1]],
                [4, 1, [1]],
            ])
            if (flipped) grid = transpose(grid)
            const result = findLockedCandidates(grid)
            expect(result?.strategy).toBe("Pointing candidates")
            expect(result?.eliminations).toEqual([
                { row: flipped ? 4 : 0, col: flipped ? 0 : 4, value: 1 },
            ])
        },
    )

    it.each([false, true])(
        "finds claiming candidates (transposed: %s)",
        (flipped) => {
            let grid = candidateFixture([
                [0, 0, [1]],
                [0, 1, [1]],
                [1, 2, [1]],
                [1, 4, [1]],
            ])
            if (flipped) grid = transpose(grid)
            const result = findLockedCandidates(grid)
            expect(result?.strategy).toBe("Claiming candidates")
            expect(result?.eliminations).toEqual([
                { row: flipped ? 2 : 1, col: flipped ? 1 : 2, value: 1 },
            ])
        },
    )

    it("does not claim a digit when another position exists outside the box", () => {
        const grid = getCandidateGrid(emptyBoard())
        expect(findLockedCandidates(grid)).toBeNull()
    })

    it("removes a naked pair only from peers in the same unit", () => {
        const grid = candidateFixture([
            [0, 0, [1, 2]],
            [0, 4, [1, 2]],
            [0, 8, [1, 2, 3]],
            [4, 8, [1, 2, 3]],
        ])
        const result = findSubset(grid, 2)
        expect(result?.eliminations).toEqual([
            { row: 0, col: 8, value: 1 },
            { row: 0, col: 8, value: 2 },
        ])
    })

    it("recognizes a naked triple whose cells have different candidate pairs", () => {
        const grid = candidateFixture([
            [0, 0, [1, 2]],
            [0, 4, [2, 3]],
            [0, 8, [1, 3]],
            [0, 5, [1, 3, 4]],
        ])
        expect(findSubset(grid, 2)).toBeNull()
        expect(findSubset(grid, 3)?.eliminations).toEqual([
            { row: 0, col: 5, value: 1 },
            { row: 0, col: 5, value: 3 },
        ])
    })

    it("does not confuse three candidates in two cells with a naked pair", () => {
        const grid = candidateFixture([
            [0, 0, [1, 2]],
            [0, 4, [2, 3]],
            [0, 8, [1, 2, 3, 4]],
        ])
        expect(findSubset(grid, 2)).toBeNull()
    })

    it("restricts a hidden pair to its reserved digits", () => {
        const grid = candidateFixture([
            [0, 0, [1, 2, 3]],
            [0, 4, [1, 2, 4]],
            [0, 8, [3, 4]],
        ])
        expect(findSubset(grid, 2, true)?.eliminations).toEqual([
            { row: 0, col: 0, value: 3 },
            { row: 0, col: 4, value: 4 },
        ])
    })

    it("restricts a hidden triple, even when not all digits occur in every cell", () => {
        const grid = candidateFixture([
            [0, 0, [1, 2, 4]],
            [0, 4, [2, 3, 5]],
            [0, 8, [1, 3, 6]],
            [0, 5, [4, 5, 6]],
        ])
        expect(findSubset(grid, 3, true)?.eliminations).toEqual([
            { row: 0, col: 0, value: 4 },
            { row: 0, col: 4, value: 5 },
            { row: 0, col: 8, value: 6 },
        ])
    })

    it.each([false, true])("finds an X-Wing (transposed: %s)", (flipped) => {
        let grid = candidateFixture([
            [0, 1, [5]],
            [0, 6, [5]],
            [4, 1, [5]],
            [4, 6, [5]],
            [7, 1, [5, 8]],
            [8, 8, [5, 9]],
        ])
        if (flipped) grid = transpose(grid)
        const result = findXWing(grid)
        expect(result?.strategy).toBe("X-Wing")
        expect(result?.eliminations).toEqual([
            { row: flipped ? 1 : 7, col: flipped ? 7 : 1, value: 5 },
        ])
        expect(result?.steps[0].focus).toHaveLength(4)
    })

    it("rejects an X-Wing when one base line has a third position", () => {
        const grid = candidateFixture([
            [0, 1, [5]],
            [0, 6, [5]],
            [0, 8, [5]],
            [4, 1, [5]],
            [4, 6, [5]],
            [7, 1, [5, 8]],
        ])
        expect(findXWing(grid)).toBeNull()
    })
})

describe("end-to-end proof soundness", () => {
    it("never excludes a known solution digit across deterministic puzzles and their continuations", () => {
        let seed = 20260909
        const random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
            return seed / 4294967296
        }
        let placements = 0
        let eliminations = 0
        let chains = 0
        let oracleChecks = 0
        for (let sample = 0; sample < 40; sample++) {
            const board = SOLUTION.map((row) =>
                row.map((value) => (random() < 0.7 ? 0 : value)),
            )
            for (let move = 0; move < 81; move++) {
                const before = JSON.stringify(board)
                const hint = getHint(board)
                expect(JSON.stringify(board)).toBe(before)
                if (!hint) break
                expect(hint.kind).not.toBe("conflict")
                const grid = getCandidateGrid(board)
                for (const step of hint.steps) {
                    for (const mark of step.eliminated) {
                        expect(grid[mark.row][mark.col]).toContain(mark.value)
                        expect(mark.value).not.toBe(
                            SOLUTION[mark.row][mark.col],
                        )
                        // Independent exhaustive search checks *all* solutions,
                        // not just the known completion used to build the fixture.
                        if (oracleChecks < 30) {
                            const trial = board.map((row) => [...row])
                            trial[mark.row][mark.col] = mark.value
                            expect(hasCompletion(trial)).toBe(false)
                            oracleChecks++
                        }
                        grid[mark.row][mark.col] = grid[mark.row][
                            mark.col
                        ].filter((value) => value !== mark.value)
                        eliminations++
                    }
                }
                if (hint.kind !== "placement" || !hint.cell || !hint.value)
                    break
                expect(hint.value).toBe(SOLUTION[hint.cell.row][hint.cell.col])
                if (hint.steps.length > 3) chains++
                board[hint.cell.row][hint.cell.col] = hint.value
                placements++
            }
        }
        expect(placements).toBeGreaterThan(100)
        expect(eliminations).toBeGreaterThan(20)
        expect(chains).toBeGreaterThan(0)
        expect(oracleChecks).toBe(30)
    })
})

// No hint-engine candidate state or deduction functions are used by this oracle.
function hasCompletion(board: Board): boolean {
    const cell = findMrvCell(board)
    if (!cell) return true
    const [row, col] = cell
    for (let value = 1; value <= 9; value++) {
        if (!isValidPlacement(board, row, col, value)) continue
        board[row][col] = value
        const solved = hasCompletion(board)
        board[row][col] = 0
        if (solved) return true
    }
    return false
}
