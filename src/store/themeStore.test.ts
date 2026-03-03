import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    mockMatchMedia(false)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("themeStore", () => {
    it("default theme is 'system' when localStorage is empty", async () => {
        const { themeState } = await import("./themeStore")
        expect(themeState.theme).toBe("system")
    })

    it("setTheme('dark') sets data-theme to 'dark'", async () => {
        const { setTheme } = await import("./themeStore")
        setTheme("dark")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it("setTheme('light') sets data-theme to 'light'", async () => {
        const { setTheme } = await import("./themeStore")
        setTheme("light")
        expect(document.documentElement.dataset.theme).toBe("light")
    })

    it("setTheme('system') resolves to 'light' when OS prefers light", async () => {
        mockMatchMedia(false)
        const { setTheme } = await import("./themeStore")
        setTheme("system")
        expect(document.documentElement.dataset.theme).toBe("light")
    })

    it("setTheme('system') resolves to 'dark' when OS prefers dark", async () => {
        mockMatchMedia(true)
        const { setTheme } = await import("./themeStore")
        setTheme("system")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })

    it("setTheme persists to localStorage", async () => {
        const { setTheme } = await import("./themeStore")
        setTheme("dark")
        expect(localStorage.getItem("vcsudoku-theme")).toBe("dark")

        setTheme("light")
        expect(localStorage.getItem("vcsudoku-theme")).toBe("light")

        setTheme("system")
        expect(localStorage.getItem("vcsudoku-theme")).toBe("system")
    })

    it("loads persisted theme from localStorage on module init", async () => {
        localStorage.setItem("vcsudoku-theme", "dark")
        const { themeState } = await import("./themeStore")
        expect(themeState.theme).toBe("dark")
        expect(document.documentElement.dataset.theme).toBe("dark")
    })
})
