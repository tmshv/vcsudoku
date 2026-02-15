import { useEffect, useMemo, useRef } from "react"
import { useSnapshot } from "valtio"
import {
    type CellPos,
    clearCell,
    computeErrors,
    computeWon,
    gameData,
    gameUI,
    newGame,
    placeNumber,
    redo,
    selectCell,
    tickTimer,
    toggleNote,
    toggleNotesMode,
    undo,
} from "./store/gameStore"
import { useKeyboard } from "./useKeyboard"

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

    useKeyboard()

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
