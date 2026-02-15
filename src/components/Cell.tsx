import type { CellOverlay } from "./Board"

interface CellProps {
    value: number
    isInitial: boolean
    isSelected: boolean
    isHighlighted: boolean
    isSameNumber: boolean
    isError: boolean
    notes: readonly number[]
    overlay?: CellOverlay | null
    onClick: () => void
}

export function Cell({
    value,
    isInitial,
    isSelected,
    isHighlighted,
    isSameNumber,
    isError,
    notes,
    overlay,
    onClick,
}: CellProps) {
    let className = "cell"
    if (isSelected) className += " cell-selected"
    else if (isSameNumber) className += " cell-same-number"
    else if (isHighlighted) className += " cell-highlighted"
    if (isError) className += " cell-error"
    if (isInitial) className += " cell-initial"

    const showNotes = value === 0 && notes.length > 0

    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard handled globally via window keydown
        // biome-ignore lint/a11y/noStaticElementInteractions: keyboard handled globally via window keydown
        <div className={className} onClick={onClick}>
            {value !== 0 ? (
                value
            ) : showNotes ? (
                <div className="cell-notes">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <span key={n}>{notes.includes(n) ? n : ""}</span>
                    ))}
                </div>
            ) : (
                ""
            )}
            {overlay && (
                <div
                    className={`cell-overlay${overlay.dimmed ? " cell-overlay-dimmed" : ""}`}
                >
                    <span className="cell-overlay-label">{overlay.label}</span>
                </div>
            )}
        </div>
    )
}
