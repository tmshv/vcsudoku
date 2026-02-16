import { proxy } from "valtio"
import { findClosestCell } from "../findClosestCell"
import { computeWon, gameData, gameUI, selectCell } from "./gameStore"

interface FindState {
    active: boolean
}

export const findState = proxy<FindState>({
    active: false,
})

export function activate() {
    findState.active = true
}

export function deactivate() {
    findState.active = false
}

export function handleKey(e: KeyboardEvent): boolean {
    if (!findState.active) {
        if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            if (computeWon(gameData.value.board, gameUI.solution)) {
                return false
            }
            e.preventDefault()
            activate()
            return true
        }
        return false
    }

    // When active, consume all keys
    e.preventDefault()

    if (e.key === "Escape") {
        deactivate()
        return true
    }

    const digitMatch = e.code.match(/^Digit([1-9])$/)
    if (digitMatch) {
        const digit = Number.parseInt(digitMatch[1], 10)
        const sel = gameUI.selected
        if (sel) {
            const target = findClosestCell(gameData.value.board, sel, digit)
            if (target) {
                selectCell(target)
            }
        }
        deactivate()
        return true
    }

    return true
}
