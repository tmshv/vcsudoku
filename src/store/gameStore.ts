import { proxy } from "valtio"
import { proxyWithHistory } from "valtio-history"
import { type Board, type Difficulty, generatePuzzle } from "../sudoku"

export interface CellPos {
    row: number
    col: number
}

interface GameData {
    board: Board
    notes: number[][][]
}

interface GameUI {
    solution: Board
    initial: boolean[][]
    selected: CellPos | null
    difficulty: Difficulty
    elapsed: number
    notesMode: boolean
}

function emptyNotes(): number[][][] {
    return Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => [] as number[]),
    )
}

function createInitialData(puzzle: Board): GameData {
    return {
        board: puzzle,
        notes: emptyNotes(),
    }
}

function createInitialUI(
    solution: Board,
    puzzle: Board,
    difficulty: Difficulty,
): GameUI {
    return {
        solution,
        initial: puzzle.map((row) => row.map((v) => v !== 0)),
        selected: null,
        difficulty,
        elapsed: 0,
        notesMode: false,
    }
}

function initGame(difficulty: Difficulty) {
    const { puzzle, solution } = generatePuzzle(difficulty)
    return { puzzle, solution }
}

const firstGame = initGame("easy")

export const gameData = proxyWithHistory<GameData>(
    createInitialData(firstGame.puzzle),
    { skipSubscribe: true },
)

export const gameUI = proxy<GameUI>(
    createInitialUI(firstGame.solution, firstGame.puzzle, "easy"),
)

function cellKey(row: number, col: number) {
    return `${row},${col}`
}

export function computeErrors(board: Board, solution: Board): Set<string> {
    const errors = new Set<string>()
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) {
                errors.add(cellKey(r, c))
            }
        }
    }
    return errors
}

export function computeWon(board: Board, solution: Board): boolean {
    return board.every((row, r) =>
        row.every((val, c) => val !== 0 && val === solution[r][c]),
    )
}

export function selectCell(pos: CellPos | null) {
    gameUI.selected = pos
}

export function moveSelection(dr: number, dc: number) {
    if (!gameUI.selected) {
        gameUI.selected = { row: 0, col: 0 }
        return
    }
    gameUI.selected = {
        row: Math.max(0, Math.min(8, gameUI.selected.row + dr)),
        col: Math.max(0, Math.min(8, gameUI.selected.col + dc)),
    }
}

function nextBlockPos(pos: number, dir: number): number {
    if (dir > 0) return Math.min(8, (Math.floor(pos / 3) + 1) * 3)
    if (dir < 0) return Math.max(0, (Math.ceil(pos / 3) - 1) * 3)
    return pos
}

export function moveSelectionToBlock(dr: number, dc: number) {
    if (!gameUI.selected) {
        gameUI.selected = { row: 0, col: 0 }
        return
    }
    gameUI.selected = {
        row: nextBlockPos(gameUI.selected.row, dr),
        col: nextBlockPos(gameUI.selected.col, dc),
    }
}

export function placeNumber(num: number) {
    const sel = gameUI.selected
    if (!sel) return
    if (computeWon(gameData.value.board, gameUI.solution)) return
    if (gameUI.initial[sel.row][sel.col]) return

    gameData.value.board[sel.row][sel.col] = num
    gameData.value.notes[sel.row][sel.col] = []

    const boxR = Math.floor(sel.row / 3) * 3
    const boxC = Math.floor(sel.col / 3) * 3
    for (let i = 0; i < 9; i++) {
        gameData.value.notes[sel.row][i] = gameData.value.notes[sel.row][
            i
        ].filter((n) => n !== num)
        gameData.value.notes[i][sel.col] = gameData.value.notes[i][
            sel.col
        ].filter((n) => n !== num)
        const br = boxR + Math.floor(i / 3)
        const bc = boxC + (i % 3)
        gameData.value.notes[br][bc] = gameData.value.notes[br][bc].filter(
            (n) => n !== num,
        )
    }

    gameData.saveHistory()
}

export function clearCell() {
    const sel = gameUI.selected
    if (!sel) return
    if (computeWon(gameData.value.board, gameUI.solution)) return
    if (gameUI.initial[sel.row][sel.col]) return

    gameData.value.board[sel.row][sel.col] = 0
    gameData.value.notes[sel.row][sel.col] = []

    gameData.saveHistory()
}

export function toggleNote(num: number) {
    const sel = gameUI.selected
    if (!sel) return
    if (computeWon(gameData.value.board, gameUI.solution)) return
    if (gameUI.initial[sel.row][sel.col]) return
    if (gameData.value.board[sel.row][sel.col] !== 0) return

    const cellNotes = gameData.value.notes[sel.row][sel.col]
    const idx = cellNotes.indexOf(num)
    if (idx >= 0) {
        cellNotes.splice(idx, 1)
    } else {
        cellNotes.push(num)
    }

    gameData.saveHistory()
}

export function tickTimer() {
    if (computeWon(gameData.value.board, gameUI.solution)) return
    gameUI.elapsed += 1
}

export function toggleNotesMode() {
    gameUI.notesMode = !gameUI.notesMode
}

export function newGame(difficulty: Difficulty) {
    const { puzzle, solution } = initGame(difficulty)

    const data = createInitialData(puzzle)
    gameData.value.board = data.board
    gameData.value.notes = data.notes
    gameData.history.nodes.splice(0)
    gameData.history.index = -1
    gameData.saveHistory()

    const ui = createInitialUI(solution, puzzle, difficulty)
    gameUI.solution = ui.solution
    gameUI.initial = ui.initial
    gameUI.selected = ui.selected
    gameUI.difficulty = ui.difficulty
    gameUI.elapsed = ui.elapsed
    gameUI.notesMode = ui.notesMode
}

export function undo() {
    gameData.undo()
}

export function redo() {
    gameData.redo()
}
