import type { CellPos } from "./store/gameStore"

export function findClosestCell(
    board: number[][],
    from: CellPos,
    digit: number,
): CellPos | null {
    let best: CellPos | null = null
    let bestDist = Number.POSITIVE_INFINITY

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== digit) continue
            if (r === from.row && c === from.col) continue

            const dist = Math.abs(r - from.row) + Math.abs(c - from.col)
            if (
                dist < bestDist ||
                (dist === bestDist &&
                    best !== null &&
                    (r < best.row || (r === best.row && c < best.col)))
            ) {
                best = { row: r, col: c }
                bestDist = dist
            }
        }
    }

    return best
}
