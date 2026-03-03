import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useFlashAnimation } from "./useFlashAnimation"

describe("useFlashAnimation", () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it("flash adds keys to the map", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a", "b"])
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        expect(result.current.flashMap.has("b")).toBe(true)
    })

    it("keys are removed after duration elapses", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })

    it("overlapping flashes use reference counting to keep cell lit", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            result.current.flash(["a"])
        })
        // First timer fires — count goes from 2 to 1, key still present
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        // Second timer fires — count goes from 1 to 0, key removed
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })

    it("reset clears all flash state immediately", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a", "b"])
        })
        await act(async () => {
            result.current.reset()
        })
        expect(result.current.flashMap.size).toBe(0)
    })

    it("keys added again after reset flash correctly", async () => {
        vi.useFakeTimers()
        const { result } = renderHook(() => useFlashAnimation<string>(700))
        await act(async () => {
            result.current.flash(["a"])
        })
        await act(async () => {
            result.current.reset()
        })
        await act(async () => {
            result.current.flash(["a"])
        })
        expect(result.current.flashMap.has("a")).toBe(true)
        await act(async () => {
            vi.advanceTimersByTime(700)
        })
        expect(result.current.flashMap.has("a")).toBe(false)
    })
})
