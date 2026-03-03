import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockSetTheme, mockThemeState } = vi.hoisted(() => {
    const mockThemeState = { theme: "system" }
    const mockSetTheme = vi.fn()
    return { mockThemeState, mockSetTheme }
})

vi.mock("../store/themeStore", () => ({
    themeState: mockThemeState,
    setTheme: mockSetTheme,
    THEME_OPTIONS: [
        { label: "System", value: "system" },
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
    ],
}))

vi.mock("valtio", () => ({
    useSnapshot: vi.fn((state) => state),
}))

import { SettingsPanel } from "./SettingsPanel"

afterEach(cleanup)

beforeEach(() => {
    vi.clearAllMocks()
    mockThemeState.theme = "system"
})

describe("SettingsPanel", () => {
    it("renders gear button", () => {
        render(<SettingsPanel />)
        expect(screen.getByRole("button", { name: "Settings" })).toBeDefined()
    })

    it("panel is hidden by default", () => {
        render(<SettingsPanel />)
        expect(screen.queryByText("System")).toBeNull()
    })

    it("clicking gear button opens the panel with all options", () => {
        render(<SettingsPanel />)
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        expect(screen.getByText("Light")).toBeDefined()
        expect(screen.getByText("Dark")).toBeDefined()
    })

    it("clicking a theme option calls setTheme", () => {
        render(<SettingsPanel />)
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        fireEvent.click(screen.getByRole("button", { name: "Dark" }))
        expect(mockSetTheme).toHaveBeenCalledWith("dark")
    })

    it("active theme option has theme-option-active class", () => {
        mockThemeState.theme = "dark"
        render(<SettingsPanel />)
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByRole("button", { name: "Dark" }).className).toContain(
            "theme-option-active",
        )
        expect(screen.getByRole("button", { name: "Light" }).className).not.toContain(
            "theme-option-active",
        )
    })

    it("clicking outside closes the panel", () => {
        render(<SettingsPanel />)
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        fireEvent.mouseDown(document.body)
        expect(screen.queryByText("System")).toBeNull()
    })

    it("clicking gear again closes the panel", () => {
        render(<SettingsPanel />)
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.queryByText("System")).toBeNull()
    })
})
