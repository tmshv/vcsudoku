interface NumberPadProps {
    onNumber: (n: number) => void
    onClear: () => void
    onUndo: () => void
    undoDisabled: boolean
    notesMode: boolean
    onToggleNotesMode: () => void
    board: number[][]
}

export function NumberPad({
    onNumber,
    onClear,
    onUndo,
    undoDisabled,
    notesMode,
    onToggleNotesMode,
    board,
}: NumberPadProps) {
    const counts = new Map<number, number>()
    for (const row of board) {
        for (const v of row) {
            if (v !== 0) counts.set(v, (counts.get(v) ?? 0) + 1)
        }
    }

    return (
        <div className="number-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                const full = (counts.get(n) ?? 0) >= 9
                return (
                    <button
                        type="button"
                        key={n}
                        className="num-btn"
                        disabled={full}
                        onClick={() => onNumber(n)}
                    >
                        {n}
                    </button>
                )
            })}
            <button
                type="button"
                className={`num-btn notes-btn${notesMode ? " notes-active" : ""}`}
                onClick={onToggleNotesMode}
            >
                Notes
            </button>
            <button
                type="button"
                className="num-btn undo-btn"
                disabled={undoDisabled}
                onClick={onUndo}
            >
                Undo
            </button>
            <button
                type="button"
                className="num-btn erase-btn"
                onClick={onClear}
            >
                Erase
            </button>
        </div>
    )
}
