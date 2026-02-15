import { proxy } from "valtio"
import {
    type CellPos,
    computeWon,
    gameData,
    gameUI,
    selectCell,
} from "./gameStore"

interface JumpState {
    active: boolean
    firstDigit: number | null
}

export const jumpState = proxy<JumpState>({
    active: false,
    firstDigit: null,
})

export function activate() {
    jumpState.active = true
    jumpState.firstDigit = null
}

export function deactivate() {
    jumpState.active = false
    jumpState.firstDigit = null
}

export function feedDigit(digit: number): CellPos | null {
    if (jumpState.firstDigit === null) {
        jumpState.firstDigit = digit
        return null
    }
    const pos: CellPos = {
        row: jumpState.firstDigit - 1,
        col: digit - 1,
    }
    deactivate()
    return pos
}

export function handleKey(e: KeyboardEvent): boolean {
    if (!jumpState.active) {
        if (e.key === " " && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
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
        const pos = feedDigit(digit)
        if (pos) {
            selectCell(pos)
        }
        return true
    }

    return true
}

export function getOverlay(
    row: number,
    col: number,
): { label: string; dimmed: boolean } | null {
    if (!jumpState.active) return null

    const label = `${row + 1}${col + 1}`
    const dimmed =
        jumpState.firstDigit !== null && row + 1 !== jumpState.firstDigit

    return { label, dimmed }
}
