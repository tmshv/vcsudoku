import { useSnapshot } from "valtio"
import {
    applyHint,
    dismissHint,
    hintState,
    nextHintStep,
    previousHintStep,
    revealAnswer,
} from "../store/hintStore"

export function HintPanel() {
    const { hint, step } = useSnapshot(hintState)
    if (!hint) return null
    const current = hint.steps[step]
    const last = step === hint.steps.length - 1
    const canApply =
        last && (hint.kind === "placement" || hint.kind === "reveal")

    return (
        <section className="hint-panel" aria-label="Sudoku hint">
            <div className="hint-header">
                <span className="hint-eyebrow">
                    {hint.kind === "reveal"
                        ? "Answer reveal"
                        : "Hint walkthrough"}{" "}
                    · {step + 1}/{hint.steps.length}
                </span>
                <button
                    type="button"
                    className="hint-close"
                    onClick={dismissHint}
                    aria-label="Dismiss hint"
                >
                    ×
                </button>
            </div>
            <div aria-live="polite" aria-atomic="true">
                <h2>{current.title}</h2>
                <p>{current.explanation}</p>
            </div>
            <div className="hint-legend">
                <span>
                    <i className="hint-swatch hint-swatch-unit" />
                    Unit
                </span>
                <span>
                    <i className="hint-swatch hint-swatch-focus" />
                    Focus
                </span>
                <span>
                    <i className="hint-swatch hint-swatch-evidence" />
                    Placed digits
                </span>
                <span>
                    <s>3</s> Excluded
                </span>
            </div>
            <p className="hint-caption">
                R = row, C = column. Small digits are computed candidates; your
                notes are unchanged. Circled candidates form the pattern.
            </p>
            <div className="hint-actions">
                <button
                    type="button"
                    onClick={previousHintStep}
                    disabled={step === 0}
                >
                    Back
                </button>
                {!last && (
                    <button
                        type="button"
                        className="hint-primary"
                        onClick={nextHintStep}
                    >
                        Explain next
                    </button>
                )}
                {canApply && (
                    <button
                        type="button"
                        className="hint-primary"
                        onClick={applyHint}
                    >
                        Place {hint.value} in R{(hint.cell?.row ?? 0) + 1}C
                        {(hint.cell?.col ?? 0) + 1}
                    </button>
                )}
                {last &&
                    (hint.kind === "stuck" || hint.kind === "elimination") && (
                        <button type="button" onClick={revealAnswer}>
                            Reveal an answer
                        </button>
                    )}
            </div>
        </section>
    )
}
