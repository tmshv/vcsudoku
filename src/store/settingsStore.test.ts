import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const KEY = "vcsudoku-settings"
const LEGACY_THEME_KEY = "vcsudoku-theme"

function mockMatchMedia(prefersDark: boolean) {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockReturnValue({
            matches: prefersDark,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }),
    })
}

function stored() {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}")
}

beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    mockMatchMedia(false)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("settingsStore theme", () => {
    it("default theme is 'system' when localStorage is empty", async () => {
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("system")
    })

    it("setTheme('dark') sets data-theme to 'dark'", async () => {
        const { setTheme } = await import("./settingsStore")
        setTheme("dark")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it("setTheme('light') sets data-theme to 'light'", async () => {
        const { setTheme } = await import("./settingsStore")
        setTheme("light")
        expect(document.documentElement.dataset.theme).toBe("light")
    })

    it("setTheme('system') resolves to 'light' when OS prefers light", async () => {
        mockMatchMedia(false)
        const { setTheme } = await import("./settingsStore")
        setTheme("system")
        expect(document.documentElement.dataset.theme).toBe("light")
    })

    it("setTheme('system') resolves to 'dark' when OS prefers dark", async () => {
        mockMatchMedia(true)
        const { setTheme } = await import("./settingsStore")
        setTheme("system")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it("setTheme persists to localStorage", async () => {
        const { setTheme } = await import("./settingsStore")
        setTheme("dark")
        expect(stored().theme).toBe("dark")

        setTheme("light")
        expect(stored().theme).toBe("light")
    })

    it("loads persisted theme on module init", async () => {
        localStorage.setItem(KEY, JSON.stringify({ theme: "dark" }))
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("dark")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })
})

describe("settingsStore difficulty", () => {
    it("defaults to 'easy' when localStorage is empty", async () => {
        const { settings } = await import("./settingsStore")
        expect(settings.difficulty).toBe("easy")
    })

    it("setDifficulty persists and updates state", async () => {
        const { settings, setDifficulty } = await import("./settingsStore")
        setDifficulty("hard")
        expect(settings.difficulty).toBe("hard")
        expect(stored().difficulty).toBe("hard")
    })

    it("loads persisted difficulty on module init", async () => {
        localStorage.setItem(KEY, JSON.stringify({ difficulty: "expert" }))
        const { settings } = await import("./settingsStore")
        expect(settings.difficulty).toBe("expert")
    })

    it("falls back to 'easy' for an unknown stored difficulty", async () => {
        localStorage.setItem(KEY, JSON.stringify({ difficulty: "nightmare" }))
        const { settings } = await import("./settingsStore")
        expect(settings.difficulty).toBe("easy")
    })
})

describe("settingsStore customCells", () => {
    it("defaults to 50 when localStorage is empty", async () => {
        const { settings } = await import("./settingsStore")
        expect(settings.customCells).toBe(50)
    })

    it("setCustomCells persists and updates state", async () => {
        const { settings, setCustomCells } = await import("./settingsStore")
        setCustomCells(37)
        expect(settings.customCells).toBe(37)
        expect(stored().customCells).toBe(37)
    })

    it("setCustomCells clamps to the 20..64 range", async () => {
        const { settings, setCustomCells } = await import("./settingsStore")
        setCustomCells(5)
        expect(settings.customCells).toBe(20)
        setCustomCells(100)
        expect(settings.customCells).toBe(64)
    })

    it("falls back to 50 for an out-of-range stored value", async () => {
        localStorage.setItem(KEY, JSON.stringify({ customCells: 999 }))
        const { settings } = await import("./settingsStore")
        expect(settings.customCells).toBe(50)
    })

    it("falls back to 50 for a non-numeric stored value", async () => {
        localStorage.setItem(KEY, JSON.stringify({ customCells: "lots" }))
        const { settings } = await import("./settingsStore")
        expect(settings.customCells).toBe(50)
    })
})

describe("settingsStore countMistakes", () => {
    it("defaults to false when localStorage is empty", async () => {
        const { settings } = await import("./settingsStore")
        expect(settings.countMistakes).toBe(false)
    })

    it("setCountMistakes persists and updates state", async () => {
        const { settings, setCountMistakes } = await import("./settingsStore")
        setCountMistakes(true)
        expect(settings.countMistakes).toBe(true)
        expect(stored().countMistakes).toBe(true)

        setCountMistakes(false)
        expect(settings.countMistakes).toBe(false)
        expect(stored().countMistakes).toBe(false)
    })

    it("loads a persisted value on module init", async () => {
        localStorage.setItem(KEY, JSON.stringify({ countMistakes: true }))
        const { settings } = await import("./settingsStore")
        expect(settings.countMistakes).toBe(true)
    })

    it("falls back to false for a non-boolean stored value", async () => {
        localStorage.setItem(KEY, JSON.stringify({ countMistakes: "yes" }))
        const { settings } = await import("./settingsStore")
        expect(settings.countMistakes).toBe(false)
    })
})

describe("settingsStore loading", () => {
    it("falls back to defaults when the stored blob is not valid JSON", async () => {
        localStorage.setItem(KEY, "{not json")
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("system")
        expect(settings.difficulty).toBe("easy")
        expect(settings.customCells).toBe(50)
        expect(settings.countMistakes).toBe(false)
    })

    it("falls back to defaults when the stored blob is not an object", async () => {
        localStorage.setItem(KEY, '"dark"')
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("system")
    })

    it("keeps valid fields when other fields are invalid", async () => {
        localStorage.setItem(
            KEY,
            JSON.stringify({ theme: "dark", difficulty: 7 }),
        )
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("dark")
        expect(settings.difficulty).toBe("easy")
    })

    it("migrates the theme from the legacy key and removes it", async () => {
        localStorage.setItem(LEGACY_THEME_KEY, "dark")
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("dark")
        expect(stored().theme).toBe("dark")
        expect(localStorage.getItem(LEGACY_THEME_KEY)).toBeNull()
    })

    it("prefers the settings blob over the legacy theme key", async () => {
        localStorage.setItem(LEGACY_THEME_KEY, "dark")
        localStorage.setItem(KEY, JSON.stringify({ theme: "light" }))
        const { settings } = await import("./settingsStore")
        expect(settings.theme).toBe("light")
    })
})
