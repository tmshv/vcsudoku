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
