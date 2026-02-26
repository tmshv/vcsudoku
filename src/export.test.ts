import { describe, expect, it } from "vitest"
import { boardToAscii } from "./export"

const SEP = "+-------+-------+-------+"

function makeBoard(fill: number): number[][] {
    return Array.from({ length: 9 }, () => Array(9).fill(fill))
}

describe("boardToAscii", () => {
    it("empty board has all dots and correct separators", () => {
        const board = makeBoard(0)
        const result = boardToAscii(board)
        const lines = result.split("\n")

        expect(lines).toHaveLength(13)
        expect(lines[0]).toBe(SEP)
        expect(lines[4]).toBe(SEP)
        expect(lines[8]).toBe(SEP)
        expect(lines[12]).toBe(SEP)

        for (const line of lines) {
            if (line === SEP) continue
            expect(line).not.toMatch(/[1-9]/)
            expect(line).toMatch(/\| \. \. \. \| \. \. \. \| \. \. \. \|/)
        }
    })

    it("fully filled board shows all digits, no dots", () => {
        const board = Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => ((row * 9 + col) % 9) + 1),
        )
        const result = boardToAscii(board)
        expect(result).not.toContain(".")
        expect(result).toContain(SEP)
    })

    it("partial board shows correct mix of dots and digits", () => {
        const board = makeBoard(0)
        board[0][0] = 5
        board[0][1] = 3
        board[4][4] = 7

        const result = boardToAscii(board)
        const lines = result.split("\n")

        // First data row: 5 3 . | . . . | . . .
        expect(lines[1]).toBe("| 5 3 . | . . . | . . . |")
        // Middle row (row index 4, line index 4+2=6 counting separators)
        expect(lines[6]).toBe("| . . . | . 7 . | . . . |")
    })
})
