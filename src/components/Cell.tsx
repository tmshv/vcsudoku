interface CellProps {
  value: number
  isInitial: boolean
  isSelected: boolean
  isHighlighted: boolean
  isSameNumber: boolean
  isError: boolean
  notes: Set<number>
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
  onClick,
}: CellProps) {
  let className = "cell"
  if (isSelected) className += " cell-selected"
  else if (isSameNumber) className += " cell-same-number"
  else if (isHighlighted) className += " cell-highlighted"
  if (isError) className += " cell-error"
  if (isInitial) className += " cell-initial"

  const showNotes = value === 0 && notes.size > 0

  return (
    // biome-ignore lint/a11y/useSemanticElements: cell is a CSS grid item styled as div
    <div
      className={className}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={-1}
    >
      {value !== 0 ? (
        value
      ) : showNotes ? (
        <div className="cell-notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n}>{notes.has(n) ? n : ""}</span>
          ))}
        </div>
      ) : (
        ""
      )}
    </div>
  )
}
