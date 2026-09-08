import { Settings } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useSnapshot } from "valtio"
import { boardFromAscii } from "../export"
import { loadBoard, newCustomGame } from "../store/gameStore"
import {
    DIFFICULTIES,
    MAX_CUSTOM_CELLS,
    MIN_CUSTOM_CELLS,
    setCountMistakes,
    setTheme,
    settings,
    THEME_OPTIONS,
} from "../store/settingsStore"
import type { Difficulty } from "../sudoku"

interface SettingsPanelProps {
    difficulty: Difficulty
    customCells: number | null
    onNewGame: (d: Difficulty) => void
}

function difficultyLabel(
    difficulty: Difficulty,
    customCells: number | null,
): string {
    if (customCells !== null) return `Custom · ${customCells}`
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

export function SettingsPanel({
    difficulty,
    customCells,
    onNewGame,
}: SettingsPanelProps) {
    const snap = useSnapshot(settings)
    const [open, setOpen] = useState(false)
    const [customValue, setCustomValue] = useState(snap.customCells)
    const [importOpen, setImportOpen] = useState(false)
    const [importText, setImportText] = useState("")
    const [importError, setImportError] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

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
        <div ref={panelRef} className="settings-wrapper">
            <button
                type="button"
                className="settings-gear"
                onClick={() => setOpen((v) => !v)}
                aria-label="Settings"
            >
                <span className="settings-difficulty">
                    {difficultyLabel(difficulty, customCells)}
                </span>
                <Settings size={18} aria-hidden="true" />
            </button>
            {open && (
                <div className="settings-panel">
                    <h3>Difficulty</h3>
                    <div className="difficulty-group">
                        {DIFFICULTIES.map((d) => (
                            <button
                                type="button"
                                key={d}
                                className={`diff-btn${difficulty === d ? " diff-active" : ""}`}
                                onClick={() => {
                                    onNewGame(d)
                                    setOpen(false)
                                }}
                            >
                                {d.charAt(0).toUpperCase() + d.slice(1)}
                            </button>
                        ))}
                    </div>
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
                    <h3>Mistakes</h3>
                    <label className="settings-toggle">
                        <input
                            type="checkbox"
                            checked={snap.countMistakes}
                            onChange={(e) => setCountMistakes(e.target.checked)}
                        />
                        <span>Count mistakes</span>
                    </label>
                    <h3>Custom Difficulty</h3>
                    <div className="custom-difficulty">
                        <label htmlFor="custom-cells">Cells removed</label>
                        <input
                            id="custom-cells"
                            type="number"
                            min={MIN_CUSTOM_CELLS}
                            max={MAX_CUSTOM_CELLS}
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
                    <h3>Import</h3>
                    {!importOpen ? (
                        <button
                            type="button"
                            className="import-open-btn"
                            onClick={() => setImportOpen(true)}
                        >
                            Import ASCII board
                        </button>
                    ) : (
                        <div className="import-section">
                            <textarea
                                className="import-textarea"
                                placeholder="Paste ASCII board here..."
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                rows={11}
                            />
                            <div className="import-actions">
                                <button
                                    type="button"
                                    className="import-load-btn"
                                    onClick={() => {
                                        const parsed =
                                            boardFromAscii(importText)
                                        if (!parsed || !loadBoard(parsed)) {
                                            setImportError(true)
                                            return
                                        }
                                        setImportOpen(false)
                                        setImportText("")
                                        setImportError(false)
                                        setOpen(false)
                                    }}
                                >
                                    Load
                                </button>
                                <button
                                    type="button"
                                    className="import-cancel-btn"
                                    onClick={() => {
                                        setImportOpen(false)
                                        setImportError(false)
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                            {importError && (
                                <p className="import-error">
                                    Could not parse board. Check the format.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
