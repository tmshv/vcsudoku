import { Settings } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSnapshot } from "valtio"
import { newCustomGame } from "../store/gameStore"
import { setTheme, THEME_OPTIONS, themeState } from "../store/themeStore"

export function SettingsPanel() {
    const [open, setOpen] = useState(false)
    const [customValue, setCustomValue] = useState(50)
    const panelRef = useRef<HTMLDivElement>(null)
    const snap = useSnapshot(themeState)

    useEffect(() => {
        if (!open) return
        function handleClick(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [open])

    return (
        <div ref={panelRef}>
            <button
                type="button"
                className="settings-gear"
                onClick={() => setOpen((v) => !v)}
                aria-label="Settings"
            >
                <Settings size={16} aria-hidden="true" />
            </button>
            {open && (
                <div className="settings-panel">
                    <h3>Theme</h3>
                    <div className="theme-options">
                        {THEME_OPTIONS.map(({ label, value }) => (
                            <button
                                type="button"
                                key={value}
                                className={`theme-option${snap.theme === value ? " theme-option-active" : ""}`}
                                onClick={() => setTheme(value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <h3>Custom Difficulty</h3>
                    <div className="custom-difficulty">
                        <label htmlFor="custom-cells">Cells removed</label>
                        <input
                            id="custom-cells"
                            type="number"
                            min={20}
                            max={64}
                            value={customValue}
                            onChange={(e) =>
                                setCustomValue(Number(e.target.value))
                            }
                            className="custom-cells-input"
                        />
                        <button
                            type="button"
                            className="custom-play-btn"
                            onClick={() => {
                                newCustomGame(customValue)
                                setOpen(false)
                            }}
                        >
                            Play
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
