import { useEffect, useRef } from "react"
import { useFlashAnimation } from "../hooks/useFlashAnimation"
import { computeFull } from "../store/gameStore"

interface NumberPadProps {
    onNumber: (n: number) => void
    onClear: () => void
    onUndo: () => void
    onRedo: () => void
    onHint: () => void
    onFillCell: () => void
    onFillLast: () => void
    undoDisabled: boolean
    redoDisabled: boolean
    notesMode: boolean
    onToggleNotesMode: () => void
    board: number[][]
    errors: Set<string>
    won: boolean
}

export function NumberPad({
    onNumber,
    onClear,
    onUndo,
    onRedo,
    onHint,
    onFillCell,
    onFillLast,
    undoDisabled,
    redoDisabled,
    notesMode,
    onToggleNotesMode,
    board,
    errors,
    won,
}: NumberPadProps) {
    const counts = new Map<number, number>()
    for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
            const v = board[r][c]
            if (v !== 0 && !errors.has(`${r},${c}`))
                counts.set(v, (counts.get(v) ?? 0) + 1)
        }
    }

    // prevFull tracks digits that were complete on the previous effect run.
    // isFirstRun lets us seed prevFull from the initial board without triggering
    // a flash for pre-filled digits that happen to total 9 on mount.
    const prevFull = useRef(new Set<number>())
    const isFirstRun = useRef(true)

    const { flashMap: flashDigits, flash: flashPad } =
        useFlashAnimation<number>(1400)

    useEffect(() => {
        const currentFull = computeFull(board, errors)

        // On first run, seed prevFull from the initial board state so that
        // pre-filled complete digits never animate.
        if (isFirstRun.current) {
            isFirstRun.current = false
            prevFull.current = currentFull
            return
        }

        const newlyComplete = [...currentFull].filter(
            (n) => !prevFull.current.has(n),
        )
        prevFull.current = currentFull

        if (newlyComplete.length === 0) return

        flashPad(newlyComplete)
    }, [board, errors, flashPad])

    return (
        <div className="number-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const full = (counts.get(n) ?? 0) >= 9
                return (
                    <button
                        type="button"
                        key={n}
                        className={`num-btn${full ? " num-btn-complete" : ""}${flashDigits.has(n) ? " num-btn-flash" : ""}`}
                        disabled={full}
                        onClick={() => onNumber(n)}
                    >
                        {n}
                    </button>
                )
            })}
            <button
                type="button"
                className={`num-btn num-action${notesMode ? " notes-active" : ""}`}
                onClick={onToggleNotesMode}
            >
                Notes
            </button>
            <button
                type="button"
                className="num-btn num-action"
                disabled={undoDisabled}
                onClick={onUndo}
            >
                Undo
            </button>
            <button
                type="button"
                className="num-btn num-action"
                disabled={redoDisabled}
                onClick={onRedo}
            >
                Redo
            </button>
            <button
                type="button"
                className="num-btn num-action num-danger"
                onClick={onClear}
            >
                Erase
            </button>
            <button
                type="button"
                className="num-btn num-action num-accent"
                disabled={won}
                onClick={onHint}
            >
                Hint
            </button>
            <button
                type="button"
                className="num-btn num-action"
                disabled={won}
                onClick={onFillCell}
            >
                Notes✦
            </button>
            <button
                type="button"
                className="num-btn num-action"
                disabled={won}
                onClick={onFillLast}
            >
                Fill
            </button>
        </div>
    )
}
