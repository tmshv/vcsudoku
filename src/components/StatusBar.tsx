import { useSnapshot } from "valtio"
import { jumpState } from "../store/jumpStore"

export interface StatusHint {
    label: string
    text: string
    shortcuts: { key: string; action: string }[]
}

function useStatusHint(): StatusHint | null {
    const jump = useSnapshot(jumpState)

    if (jump.active) {
        if (jump.firstDigit === null) {
            return {
                label: "JUMP",
                text: "Press row digit 1\u20139",
                shortcuts: [{ key: "Esc", action: "cancel" }],
            }
        }
        return {
            label: "JUMP",
            text: `Row ${jump.firstDigit} \u2014 press column 1\u20139`,
            shortcuts: [{ key: "Esc", action: "cancel" }],
        }
    }

    // Default: show basic navigation shortcuts
    return {
        label: "",
        text: "",
        shortcuts: [
            { key: "\u2190\u2191\u2193\u2192", action: "move" }, // arrow keys
            { key: "N", action: "notes" },
            { key: "Shift+1\u20139", action: "note" },
            { key: "Space", action: "jump" },
        ],
    }
}

export function StatusBar() {
    const hint = useStatusHint()
    if (!hint) return null

    return (
        <div className="status-bar">
            {hint.label && (
                <span className="status-bar-label">{hint.label}</span>
            )}
            {hint.text && <span className="status-bar-text">{hint.text}</span>}
            {hint.shortcuts.map((s) => (
                <span key={s.key} className="status-bar-shortcut">
                    <kbd>{s.key}</kbd> {s.action}
                </span>
            ))}
        </div>
    )
}
