export function boardFromAscii(text: string): number[][] | null {
    const dataLines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("|"))
    if (dataLines.length !== 9) return null
    const board: number[][] = []
    for (const line of dataLines) {
        const cells = line.replace(/\|/g, "").trim().split(/\s+/)
        if (cells.length !== 9) return null
        const row = cells.map((ch) => (ch === "." ? 0 : parseInt(ch, 10)))
        if (row.some((v) => Number.isNaN(v) || v < 0 || v > 9)) return null
        board.push(row)
    }
    return board.length === 9 ? board : null
}

const SEP = "+-------+-------+-------+"

export function boardToAscii(board: number[][]): string {
    const lines: string[] = []
    for (let row = 0; row < 9; row++) {
        if (row % 3 === 0) lines.push(SEP)
        const c = board[row].map((v) => (v === 0 ? "." : String(v)))
        lines.push(
            `| ${c[0]} ${c[1]} ${c[2]} | ${c[3]} ${c[4]} ${c[5]} | ${c[6]} ${c[7]} ${c[8]} |`,
        )
    }
    lines.push(SEP)
    return lines.join("\n")
}
