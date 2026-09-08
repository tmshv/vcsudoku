import { proxy, subscribe } from "valtio"
import { getHint, type Hint, revealHint } from "../hint"
import { deactivate as stopFind } from "./findStore"
import {
    computeWon,
    gameData,
    gameUI,
    placeNumber,
    selectCell,
} from "./gameStore"
import { deactivate as stopJump } from "./jumpStore"

export const hintState = proxy<{ hint: Hint | null; step: number }>({
    hint: null,
    step: 0,
})
let sourceBoard = ""
let sourceInitial = gameUI.initial

function boardKey() {
    return gameData.value.board.map((row) => row.join("")).join("")
}

function isCurrent() {
    return sourceBoard === boardKey() && sourceInitial === gameUI.initial
}

export function showHint() {
    if (computeWon(gameData.value.board, gameUI.solution)) return
    stopJump()
    stopFind()
    if (hintState.hint && isCurrent()) {
        nextHintStep()
        return
    }
    sourceBoard = boardKey()
    sourceInitial = gameUI.initial
    hintState.step = 0
    hintState.hint = getHint(gameData.value.board, gameUI.solution)
}

export function nextHintStep() {
    const hint = hintState.hint
    if (!hint || !isCurrent()) return dismissHint()
    hintState.step = Math.min(hintState.step + 1, hint.steps.length - 1)
    if (hintState.step === hint.steps.length - 1 && hint.cell)
        selectCell(hint.cell)
}

export function previousHintStep() {
    hintState.step = Math.max(0, hintState.step - 1)
}

export function applyHint() {
    const hint = hintState.hint
    if (!hint || !isCurrent()) return dismissHint()
    if (hintState.step !== hint.steps.length - 1 || !hint.cell || !hint.value)
        return
    if (hint.kind !== "placement" && hint.kind !== "reveal") return
    // Use the normal move path: peer notes, undo/redo, and win detection all apply.
    selectCell(hint.cell)
    placeNumber(hint.value)
    dismissHint()
}

export function revealAnswer() {
    if (!hintState.hint || !isCurrent()) return dismissHint()
    if (
        hintState.hint.kind !== "stuck" &&
        hintState.hint.kind !== "elimination"
    )
        return
    hintState.hint = revealHint(
        gameData.value.board,
        gameUI.solution,
        gameUI.selected,
    )
    hintState.step = 0
    if (hintState.hint?.cell) selectCell(hintState.hint.cell)
}

export function dismissHint() {
    hintState.hint = null
    hintState.step = 0
}

// Notes and history metadata do not invalidate a proof; changed digits do.
// Synchronous invalidation also prevents applying stale hints in the same tick.
subscribe(
    gameData,
    () => {
        if (hintState.hint && !isCurrent()) dismissHint()
    },
    true,
)
subscribe(
    gameUI,
    () => {
        if (hintState.hint && !isCurrent()) dismissHint()
    },
    true,
)
