import { describe, expect, it } from "vitest"
import {
  type Board,
  generatePuzzle,
  generateSolvedBoard,
  isValidPlacement,
  solve,
} from "./sudoku"

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0))
}

function isValidBoard(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    const row = new Set(board[r])
    if (row.size !== 9 || row.has(0)) return false
  }
  for (let c = 0; c < 9; c++) {
    const col = new Set<number>()
    for (let r = 0; r < 9; r++) col.add(board[r][c])
    if (col.size !== 9 || col.has(0)) return false
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = new Set<number>()
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          box.add(board[r][c])
        }
      }
      if (box.size !== 9 || box.has(0)) return false
    }
  }
  return true
}

describe("isValidPlacement", () => {
  it("returns true for valid placement on empty board", () => {
    const board = emptyBoard()
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
  })

  it("returns false when same number exists in row", () => {
    const board = emptyBoard()
    board[0][4] = 5
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
  })

  it("returns false when same number exists in column", () => {
    const board = emptyBoard()
    board[4][0] = 5
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
  })

  it("returns false when same number exists in 3x3 box", () => {
    const board = emptyBoard()
    board[1][1] = 5
    expect(isValidPlacement(board, 0, 0, 5)).toBe(false)
  })

  it("returns true when same number is in different box/row/col", () => {
    const board = emptyBoard()
    board[3][3] = 5
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
  })
})

describe("solve", () => {
  it("solves an empty board to a complete valid 9x9 board", () => {
    const board = emptyBoard()
    const result = solve(board)
    expect(result).not.toBeNull()
    // biome-ignore lint/style/noNonNullAssertion: asserted not null above
    expect(isValidBoard(result!)).toBe(true)
  })

  it("solves a partial board correctly", () => {
    const board = emptyBoard()
    board[0][0] = 5
    board[0][1] = 3
    board[1][0] = 6
    const result = solve(board)
    expect(result).not.toBeNull()
    // biome-ignore lint/style/noNonNullAssertion: asserted not null above
    expect(isValidBoard(result!)).toBe(true)
    // biome-ignore lint/style/noNonNullAssertion: asserted not null above
    expect(result![0][0]).toBe(5)
    // biome-ignore lint/style/noNonNullAssertion: asserted not null above
    expect(result![0][1]).toBe(3)
    // biome-ignore lint/style/noNonNullAssertion: asserted not null above
    expect(result![1][0]).toBe(6)
  })

  it("returns null for an unsolvable board", () => {
    const board = emptyBoard()
    // Fill box 0 so only 9 can go at (2,2), then block 9 via row and column
    board[0][0] = 1
    board[0][1] = 2
    board[0][2] = 3
    board[1][0] = 4
    board[1][1] = 5
    board[1][2] = 6
    board[2][0] = 7
    board[2][1] = 8
    board[3][2] = 9 // blocks 9 in column 2
    board[2][3] = 9 // blocks 9 in row 2
    // Cell (2,2) has no valid digit → unsolvable
    const result = solve(board)
    expect(result).toBeNull()
  })

  it("with randomize=false, digit order is deterministic", () => {
    const board1 = emptyBoard()
    const board2 = emptyBoard()
    const result1 = solve(board1, false)
    const result2 = solve(board2, false)
    expect(result1).toEqual(result2)
  })
})

describe("generateSolvedBoard", () => {
  it("returns a 9x9 board with no zeros", () => {
    const board = generateSolvedBoard()
    expect(board.length).toBe(9)
    for (const row of board) {
      expect(row.length).toBe(9)
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(9)
      }
    }
  })

  it("every row/col/box has digits 1-9 exactly once", () => {
    const board = generateSolvedBoard()
    expect(isValidBoard(board)).toBe(true)
  })
})

describe("generatePuzzle", () => {
  it("easy: puzzle has exactly 36 filled cells", () => {
    const { puzzle } = generatePuzzle("easy")
    const filled = puzzle.flat().filter((v) => v !== 0).length
    expect(filled).toBe(81 - 45)
  })

  it("medium: puzzle has exactly 30 filled cells", () => {
    const { puzzle } = generatePuzzle("medium")
    const filled = puzzle.flat().filter((v) => v !== 0).length
    expect(filled).toBe(81 - 51)
  })

  it("hard: puzzle has exactly 25 filled cells", () => {
    const { puzzle } = generatePuzzle("hard")
    const filled = puzzle.flat().filter((v) => v !== 0).length
    expect(filled).toBe(81 - 56)
  })

  it("solution is a valid complete board", () => {
    const { solution } = generatePuzzle("easy")
    expect(isValidBoard(solution)).toBe(true)
  })

  it("puzzle filled cells match solution at those positions", () => {
    const { puzzle, solution } = generatePuzzle("medium")
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) {
          expect(puzzle[r][c]).toBe(solution[r][c])
        }
      }
    }
  })
})
