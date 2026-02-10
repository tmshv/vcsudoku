export type Board = number[][]
export type Difficulty = "easy" | "medium" | "hard"

export function isValidPlacement(
  board: Board,
  row: number,
  col: number,
  num: number,
): boolean {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false
  }
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false
    }
  }
  return true
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function solve(board: Board, randomize = false): Board | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const digits = randomize
          ? shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
          : [1, 2, 3, 4, 5, 6, 7, 8, 9]
        for (const num of digits) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num
            if (solve(board, randomize)) return board
            board[r][c] = 0
          }
        }
        return null
      }
    }
  }
  return board
}

export function generateSolvedBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0))
  solve(board, true)
  return board
}

export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board
  solution: Board
} {
  const solution = generateSolvedBoard()
  const puzzle = solution.map((row) => [...row])

  const removals: Record<Difficulty, number> = {
    easy: 45,
    medium: 51,
    hard: 56,
  }

  const positions = shuffle(
    Array.from(
      { length: 81 },
      (_, i) => [Math.floor(i / 9), i % 9] as [number, number],
    ),
  )

  const toRemove = removals[difficulty]
  for (let i = 0; i < toRemove; i++) {
    const [r, c] = positions[i]
    puzzle[r][c] = 0
  }

  return { puzzle, solution }
}
