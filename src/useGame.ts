import { useCallback, useEffect, useRef, useState } from "react"
import { type Board, type Difficulty, generatePuzzle } from "./sudoku"

export interface CellPos {
    row: number
    col: number
}

interface GameState {
    board: Board
    solution: Board
    initial: boolean[][]
    selected: CellPos | null
    errors: Set<string>
    difficulty: Difficulty
    won: boolean
    elapsed: number
    notes: Set<number>[][]
}

function cellKey(row: number, col: number) {
    return `${row},${col}`
}

function emptyNotes(): Set<number>[][] {
    return Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set<number>()),
    )
}

function createGame(difficulty: Difficulty): Omit<GameState, "elapsed"> {
    const { puzzle, solution } = generatePuzzle(difficulty)
    const initial = puzzle.map((row) => row.map((v) => v !== 0))
    return {
        board: puzzle,
        solution,
        initial,
        selected: null,
        errors: new Set(),
        difficulty,
        won: false,
        notes: emptyNotes(),
    }
}

export function useGame() {
    const [state, setState] = useState<GameState>(() => ({
        ...createGame("easy"),
        elapsed: 0,
    }))
    const [notesMode, setNotesMode] = useState(false)

    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setState((s) => (s.won ? s : { ...s, elapsed: s.elapsed + 1 }))
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    const newGame = useCallback((difficulty: Difficulty) => {
        setState({ ...createGame(difficulty), elapsed: 0 })
        setNotesMode(false)
    }, [])

    const selectCell = useCallback((pos: CellPos | null) => {
        setState((s) => ({ ...s, selected: pos }))
    }, [])

    const placeNumber = useCallback((num: number) => {
        setState((s) => {
            if (!s.selected || s.won) return s
            const { row, col } = s.selected
            if (s.initial[row][col]) return s

            const board = s.board.map((r) => [...r])
            board[row][col] = num

            const notes = s.notes.map((r) => r.map((c) => new Set(c)))
            notes[row][col] = new Set()

            // Remove placed number from notes in same row, column, and box
            const boxR = Math.floor(row / 3) * 3
            const boxC = Math.floor(col / 3) * 3
            for (let i = 0; i < 9; i++) {
                notes[row][i].delete(num)
                notes[i][col].delete(num)
                notes[boxR + Math.floor(i / 3)][boxC + (i % 3)].delete(num)
            }

            const errors = new Set<string>()
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] !== 0 && board[r][c] !== s.solution[r][c]) {
                        errors.add(cellKey(r, c))
                    }
                }
            }

            const won =
                errors.size === 0 &&
                board.every((row, r) =>
                    row.every((val, c) => val === s.solution[r][c]),
                )

            return { ...s, board, notes, errors, won }
        })
    }, [])

    const clearCell = useCallback(() => {
        setState((s) => {
            if (!s.selected || s.won) return s
            const { row, col } = s.selected
            if (s.initial[row][col]) return s

            const board = s.board.map((r) => [...r])
            board[row][col] = 0

            const notes = s.notes.map((r) => r.map((c) => new Set(c)))
            notes[row][col] = new Set()

            const errors = new Set<string>()
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] !== 0 && board[r][c] !== s.solution[r][c]) {
                        errors.add(cellKey(r, c))
                    }
                }
            }

            return { ...s, board, notes, errors }
        })
    }, [])

    const toggleNote = useCallback((num: number) => {
        setState((s) => {
            if (!s.selected || s.won) return s
            const { row, col } = s.selected
            if (s.initial[row][col]) return s
            if (s.board[row][col] !== 0) return s

            const notes = s.notes.map((r) => r.map((c) => new Set(c)))
            const cellNotes = notes[row][col]
            if (cellNotes.has(num)) {
                cellNotes.delete(num)
            } else {
                cellNotes.add(num)
            }
            return { ...s, notes }
        })
    }, [])

    const moveSelection = useCallback((dr: number, dc: number) => {
        setState((s) => {
            if (!s.selected) return { ...s, selected: { row: 0, col: 0 } }
            const row = Math.max(0, Math.min(8, s.selected.row + dr))
            const col = Math.max(0, Math.min(8, s.selected.col + dc))
            return { ...s, selected: { row, col } }
        })
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const digitMatch = e.code.match(/^Digit([1-9])$/)
            if (digitMatch) {
                const num = parseInt(digitMatch[1], 10)
                if (e.shiftKey) {
                    toggleNote(num)
                } else {
                    placeNumber(num)
                }
            } else if (e.key === "Backspace" || e.key === "Delete") {
                clearCell()
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                moveSelection(-1, 0)
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                moveSelection(1, 0)
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                moveSelection(0, -1)
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                moveSelection(0, 1)
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [placeNumber, clearCell, moveSelection, toggleNote])

    return {
        board: state.board,
        selected: state.selected,
        initial: state.initial,
        errors: state.errors,
        difficulty: state.difficulty,
        won: state.won,
        elapsed: state.elapsed,
        notes: state.notes,
        notesMode,
        selectCell,
        placeNumber,
        clearCell,
        toggleNote,
        setNotesMode,
        newGame,
    }
}
