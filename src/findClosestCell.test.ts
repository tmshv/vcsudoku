import { describe, expect, it } from "vitest"
import { findClosestCell } from "./findClosestCell"

function emptyBoard(): number[][] {
    return Array.from({ length: 9 }, () => Array(9).fill(0))
}

describe("findClosestCell", () => {
    it("returns null when digit not on board", () => {
        const board = emptyBoard()
        const result = findClosestCell(board, { row: 4, col: 4 }, 5)
        expect(result).toBeNull()
    })

    it("finds the only matching cell", () => {
        const board = emptyBoard()
        board[2][7] = 3
        const result = findClosestCell(board, { row: 0, col: 0 }, 3)
        expect(result).toEqual({ row: 2, col: 7 })
    })

    it("picks closest by Manhattan distance when multiple matches", () => {
        const board = emptyBoard()
        board[0][0] = 5 // dist from (4,4) = 8
        board[3][3] = 5 // dist from (4,4) = 2
        board[8][8] = 5 // dist from (4,4) = 8
        const result = findClosestCell(board, { row: 4, col: 4 }, 5)
        expect(result).toEqual({ row: 3, col: 3 })
    })

    it("tiebreaker: prefers smaller row", () => {
        const board = emptyBoard()
        board[3][5] = 7 // dist from (4,4) = 2
        board[5][3] = 7 // dist from (4,4) = 2
        const result = findClosestCell(board, { row: 4, col: 4 }, 7)
        expect(result).toEqual({ row: 3, col: 5 })
    })

    it("tiebreaker: prefers smaller col when rows equal", () => {
        const board = emptyBoard()
        board[4][6] = 2 // dist from (4,4) = 2
        board[4][2] = 2 // dist from (4,4) = 2
        const result = findClosestCell(board, { row: 4, col: 4 }, 2)
        expect(result).toEqual({ row: 4, col: 2 })
    })

    it("excludes the from cell", () => {
        const board = emptyBoard()
        board[4][4] = 9
        const result = findClosestCell(board, { row: 4, col: 4 }, 9)
        expect(result).toBeNull()
    })

    it("returns the other cell when only two matches and one is from", () => {
        const board = emptyBoard()
        board[4][4] = 6
        board[7][1] = 6
        const result = findClosestCell(board, { row: 4, col: 4 }, 6)
        expect(result).toEqual({ row: 7, col: 1 })
    })

    it("returns null when only match is the from cell itself", () => {
        const board = emptyBoard()
        board[2][3] = 1
        const result = findClosestCell(board, { row: 2, col: 3 }, 1)
        expect(result).toBeNull()
    })
})
