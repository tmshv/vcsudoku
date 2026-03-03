import { proxy } from "valtio"

export type Theme = "system" | "light" | "dark"

const STORAGE_KEY = "vcsudoku-theme"

interface ThemeState {
    theme: Theme
}

function loadTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
        return stored
    }
    return "system"
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
    themeState.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
}

export const themeState = proxy<ThemeState>({
    theme: loadTheme(),
})

// Re-apply when OS preference changes while in system mode
window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
        if (themeState.theme === "system") {
            applyTheme("system")
        }
    })

// Apply on module load
applyTheme(themeState.theme)
