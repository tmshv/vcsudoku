import { useEffect, useMemo, useRef } from "react"
import { useSnapshot } from "valtio"
import {
    type CellPos,
    clearCell,
    computeErrors,
    computeWon,
    gameData,
    gameUI,
    moveSelection,
    newGame,
    placeNumber,
    redo,
    selectCell,
    tickTimer,
    toggleNote,
    toggleNotesMode,
    undo,
} from "./store/gameStore"

export type { CellPos }

export function useGame() {
    const dataSnap = useSnapshot(gameData)
    const uiSnap = useSnapshot(gameUI)

    const errors = useMemo(
        () =>
            computeErrors(
                dataSnap.value.board as number[][],
                uiSnap.solution as number[][],
            ),
        [dataSnap.value.board, uiSnap.solution],
    )

    const won = useMemo(
        () =>
            computeWon(
                dataSnap.value.board as number[][],
                uiSnap.solution as number[][],
            ),
        [dataSnap.value.board, uiSnap.solution],
    )

    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            tickTimer()
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [])

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") {
                e.preventDefault()
                redo()
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
                e.preventDefault()
                undo()
                return
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault()
                redo()
                return
            }

            const digitMatch = e.code.match(/^Digit([1-9])$/)
            if (digitMatch) {
                const num = Number.parseInt(digitMatch[1], 10)
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
    }, [])

    return {
        board: dataSnap.value.board as number[][],
        selected: uiSnap.selected as CellPos | null,
        initial: uiSnap.initial as boolean[][],
        errors,
        difficulty: uiSnap.difficulty,
        won,
        elapsed: uiSnap.elapsed,
        notes: dataSnap.value.notes as number[][][],
        notesMode: uiSnap.notesMode,
        canUndo: gameData.history.index > 0,
        canRedo: gameData.history.index < gameData.history.nodes.length - 1,
        selectCell,
        placeNumber,
        clearCell,
        toggleNote,
        toggleNotesMode,
        newGame,
        undo,
        redo,
    }
}
