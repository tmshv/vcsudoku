import { proxy } from "valtio"
import type { Difficulty } from "../sudoku"

export type Theme = "system" | "light" | "dark"

export const THEME_OPTIONS: { label: string; value: Theme }[] = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
]

export const DIFFICULTIES: Difficulty[] = [
    "easy",
    "medium",
    "hard",
    "master",
    "expert",
]

export const MIN_CUSTOM_CELLS = 20
export const MAX_CUSTOM_CELLS = 64

const STORAGE_KEY = "vcsudoku-settings"
const LEGACY_THEME_KEY = "vcsudoku-theme"

export interface Settings {
    theme: Theme
    difficulty: Difficulty
    /** Last value used in the custom difficulty input. */
    customCells: number
    /** Show the running mistake count in the header. */
    countMistakes: boolean
}

const DEFAULTS: Settings = {
    theme: "system",
    difficulty: "easy",
    customCells: 50,
    countMistakes: false,
}

function isTheme(value: unknown): value is Theme {
    return value === "system" || value === "light" || value === "dark"
}

function isDifficulty(value: unknown): value is Difficulty {
    return DIFFICULTIES.includes(value as Difficulty)
}

function isCustomCells(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= MIN_CUSTOM_CELLS &&
        value <= MAX_CUSTOM_CELLS
    )
}

export function clampCustomCells(value: number): number {
    if (!Number.isFinite(value)) return DEFAULTS.customCells
    return Math.max(
        MIN_CUSTOM_CELLS,
        Math.min(MAX_CUSTOM_CELLS, Math.round(value)),
    )
}

function readStorage(key: string): string | null {
    // Storage access throws in some privacy modes.
    try {
        return localStorage.getItem(key)
    } catch {
        return null
    }
}

function loadSettings(): { settings: Settings; migrated: boolean } {
    let parsed: unknown = null
    const raw = readStorage(STORAGE_KEY)
    if (raw !== null) {
        try {
            parsed = JSON.parse(raw)
        } catch {
            parsed = null
        }
    }
    const stored: Partial<Settings> =
        typeof parsed === "object" && parsed !== null
            ? (parsed as Partial<Settings>)
            : {}

    const legacyTheme = readStorage(LEGACY_THEME_KEY)
    const migrated = !isTheme(stored.theme) && isTheme(legacyTheme)

    return {
        settings: {
            theme: isTheme(stored.theme)
                ? stored.theme
                : isTheme(legacyTheme)
                  ? legacyTheme
                  : DEFAULTS.theme,
            difficulty: isDifficulty(stored.difficulty)
                ? stored.difficulty
                : DEFAULTS.difficulty,
            customCells: isCustomCells(stored.customCells)
                ? stored.customCells
                : DEFAULTS.customCells,
            countMistakes:
                typeof stored.countMistakes === "boolean"
                    ? stored.countMistakes
                    : DEFAULTS.countMistakes,
        },
        migrated,
    }
}

function persist(): void {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                theme: settings.theme,
                difficulty: settings.difficulty,
                customCells: settings.customCells,
                countMistakes: settings.countMistakes,
            }),
        )
    } catch {
        // Settings are a convenience; failing to persist must not break play.
    }
}

export function applyTheme(theme: Theme): void {
    let resolved: "light" | "dark"
    if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    } else {
        resolved = theme
    }
    document.documentElement.dataset.theme = resolved
}

export function setTheme(theme: Theme): void {
    settings.theme = theme
    persist()
    applyTheme(theme)
}

export function setDifficulty(difficulty: Difficulty): void {
    settings.difficulty = difficulty
    persist()
}

export function setCustomCells(cells: number): void {
    settings.customCells = clampCustomCells(cells)
    persist()
}

export function setCountMistakes(enabled: boolean): void {
    settings.countMistakes = enabled
    persist()
}

const loaded = loadSettings()

export const settings = proxy<Settings>(loaded.settings)

if (loaded.migrated) {
    persist()
    try {
        localStorage.removeItem(LEGACY_THEME_KEY)
    } catch {
        // Ignore: the legacy key is only read when no settings blob exists.
    }
}

// Re-apply when OS preference changes while in system mode
window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        if (settings.theme === "system") {
            applyTheme("system")
        }
    })

// Apply on module load
applyTheme(settings.theme)
