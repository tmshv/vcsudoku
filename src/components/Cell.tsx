import type { HintCell } from "../hint"
import type { CellOverlay } from "./Board"

interface CellHint {
    unit: boolean
    focus: boolean
    evidence: boolean
    excluded: boolean
    candidates: readonly number[]
    emphasized: readonly number[]
    eliminated: readonly number[]
}

interface CellProps {
    value: number
    isInitial: boolean
    isSelected: boolean
    isHighlighted: boolean
    isSameNumber: boolean
    isError: boolean
    isDigitComplete: boolean
    isLineComplete: boolean
    notes: readonly number[]
    /** Digit of the current selection, circled when it appears in this cell's
     * notes. 0 when nothing relevant is selected. */
    highlightNote: number
    overlay?: CellOverlay | null
    position: HintCell
    hint?: CellHint
    onClick: () => void
}

export function Cell({
    value,
    isInitial,
    isSelected,
    isHighlighted,
    isSameNumber,
    isError,
    isDigitComplete,
    isLineComplete,
    notes,
    highlightNote,
    overlay,
    position,
    hint,
    onClick,
}: CellProps) {
    let className = "cell"
    if (isSelected) className += " cell-selected"
    else if (isHighlighted) className += " cell-highlighted"
    if (
        isDigitComplete &&
        !isSelected &&
        !isSameNumber &&
        !isHighlighted &&
        !isInitial
    )
        className += " cell-digit-complete"
    if (isLineComplete) className += " cell-line-complete"
    if (isError) className += " cell-error"
    if (isInitial) className += " cell-initial"
    if (hint?.unit) className += " cell-hint-unit"
    if (hint?.excluded) className += " cell-hint-excluded"
    if (hint?.evidence) className += " cell-hint-evidence"
    if (hint?.focus) className += " cell-hint-focus"

    const displayedNotes = hint ? hint.candidates : notes
    const showNotes = value === 0 && displayedNotes.length > 0
    // An error cell keeps its red: the mistake outranks the "same digit" cue.
    // A displayed hint suppresses matching upstream (Board clears isSameNumber),
    // so the chip never competes with the hint's own focus and evidence marks.
    const matchesSelection = isSameNumber && !isError
    const label = `R${position.row + 1}C${position.col + 1}: ${value || "empty"}${hint?.focus ? ", hint focus" : ""}${hint?.evidence ? ", supporting digit" : ""}${hint?.excluded ? ", excluded position" : ""}${showNotes ? `, candidates ${displayedNotes.join(", ")}` : ""}${hint?.eliminated.length ? `, exclude ${hint.eliminated.join(", ")}` : ""}`

    return (
        <button
            type="button"
            tabIndex={
                isSelected || (position.row === 0 && position.col === 0)
                    ? 0
                    : -1
            }
            className={className}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            {value !== 0 ? (
                matchesSelection ? (
                    <span className="value-match">{value}</span>
                ) : (
                    value
                )
            ) : showNotes ? (
                <span className="cell-notes">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                        if (!displayedNotes.includes(n)) return <span key={n} />
                        return (
                            <span key={n}>
                                <span
                                    className={
                                        hint?.eliminated.includes(n)
                                            ? "note note-eliminated"
                                            : hint?.emphasized.includes(n)
                                              ? "note note-match"
                                              : hint
                                                ? "note note-hint"
                                                : n === highlightNote
                                                  ? "note note-match"
                                                  : "note"
                                    }
                                >
                                    {n}
                                </span>
                            </span>
                        )
                    })}
                </span>
            ) : (
                ""
            )}
            {hint?.excluded && !showNotes && value === 0 && (
                <span className="hint-exclusion-mark" aria-hidden="true">
                    ×
                </span>
            )}
            {overlay && (
                <span
                    className={`cell-overlay${overlay.dimmed ? " cell-overlay-dimmed" : ""}`}
                >
                    <span className="cell-overlay-label">{overlay.label}</span>
                </span>
            )}
        </button>
    )
}
