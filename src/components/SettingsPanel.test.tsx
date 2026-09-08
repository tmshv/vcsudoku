import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { mockSetTheme, mockSetCountMistakes, mockSettings, mockNewCustomGame } =
    vi.hoisted(() => {
        const mockSettings = {
            theme: "system",
            difficulty: "easy",
            customCells: 50,
            countMistakes: false,
        }
        const mockSetTheme = vi.fn()
        const mockSetCountMistakes = vi.fn()
        const mockNewCustomGame = vi.fn()
        return {
            mockSettings,
            mockSetTheme,
            mockSetCountMistakes,
            mockNewCustomGame,
        }
    })

vi.mock("../store/settingsStore", () => ({
    settings: mockSettings,
    setTheme: mockSetTheme,
    setCountMistakes: mockSetCountMistakes,
    THEME_OPTIONS: [
        { label: "System", value: "system" },
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
    ],
    DIFFICULTIES: ["easy", "medium", "hard", "master", "expert"],
    MIN_CUSTOM_CELLS: 20,
    MAX_CUSTOM_CELLS: 64,
}))

vi.mock("../store/gameStore", () => ({
    newCustomGame: mockNewCustomGame,
}))

vi.mock("valtio", () => ({
    useSnapshot: vi.fn((state) => state),
}))

import { SettingsPanel } from "./SettingsPanel"

afterEach(cleanup)

beforeEach(() => {
    vi.clearAllMocks()
    mockSettings.theme = "system"
    mockSettings.difficulty = "easy"
    mockSettings.customCells = 50
    mockSettings.countMistakes = false
})

describe("SettingsPanel", () => {
    it("renders gear button", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        expect(screen.getByRole("button", { name: "Settings" })).toBeDefined()
    })

    it("panel is hidden by default", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        expect(screen.queryByText("System")).toBeNull()
    })

    it("clicking gear button opens the panel with all options", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        expect(screen.getByText("Light")).toBeDefined()
        expect(screen.getByText("Dark")).toBeDefined()
    })

    it("clicking a theme option calls setTheme", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        fireEvent.click(screen.getByRole("button", { name: "Dark" }))
        expect(mockSetTheme).toHaveBeenCalledWith("dark")
    })

    it("active theme option has theme-option-active class", () => {
        mockSettings.theme = "dark"
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(
            screen.getByRole("button", { name: "Dark" }).className,
        ).toContain("theme-option-active")
        expect(
            screen.getByRole("button", { name: "Light" }).className,
        ).not.toContain("theme-option-active")
    })

    it("clicking outside closes the panel", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        fireEvent.mouseDown(document.body)
        expect(screen.queryByText("System")).toBeNull()
    })

    it("clicking gear again closes the panel", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByText("System")).toBeDefined()
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.queryByText("System")).toBeNull()
    })
})

describe("SettingsPanel difficulty label", () => {
    it("shows the current difficulty on the gear button", () => {
        render(
            <SettingsPanel
                difficulty="master"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        expect(screen.getByText("Master")).toBeDefined()
    })

    it("shows the cell count while a custom game is in play", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={40}
                onNewGame={vi.fn()}
            />,
        )
        expect(screen.getByText("Custom · 40")).toBeDefined()
        expect(screen.queryByText("Easy")).toBeNull()
    })

    it("keeps the gear button labelled for assistive tech", () => {
        render(
            <SettingsPanel
                difficulty="hard"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        const gear = screen.getByRole("button", { name: "Settings" })
        expect(gear.textContent).toContain("Hard")
    })
})

describe("SettingsPanel count mistakes", () => {
    it("is unchecked by default", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        const toggle = screen.getByLabelText(
            "Count mistakes",
        ) as HTMLInputElement
        expect(toggle.checked).toBe(false)
    })

    it("reflects the persisted value", () => {
        mockSettings.countMistakes = true
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        const toggle = screen.getByLabelText(
            "Count mistakes",
        ) as HTMLInputElement
        expect(toggle.checked).toBe(true)
    })

    it("toggling calls setCountMistakes", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        fireEvent.click(screen.getByLabelText("Count mistakes"))
        expect(mockSetCountMistakes).toHaveBeenCalledWith(true)
    })
})

describe("SettingsPanel custom cells", () => {
    it("seeds the input from the persisted value", () => {
        mockSettings.customCells = 37
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        const input = screen.getByLabelText("Cells removed") as HTMLInputElement
        expect(input.value).toBe("37")
    })

    it("plays a custom game with the entered value", () => {
        render(
            <SettingsPanel
                difficulty="easy"
                customCells={null}
                onNewGame={vi.fn()}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        fireEvent.change(screen.getByLabelText("Cells removed"), {
            target: { value: "44" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Play" }))
        expect(mockNewCustomGame).toHaveBeenCalledWith(44)
    })
})
