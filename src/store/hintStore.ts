import { proxy, subscribe } from "valtio"
import { getHint, type Hint } from "../hint"
import { computeWon, gameData, gameUI, selectCell } from "./gameStore"

export const hintState = proxy<{ hint: Hint | null }>({ hint: null })

export function showHint() {
    if (computeWon(gameData.value.board, gameUI.solution)) return
    const hint = getHint(gameData.value.board, gameUI.solution)
    hintState.hint = hint
    if (hint) {
        selectCell(hint.cell)
    }
}

export function dismissHint() {
    hintState.hint = null
}

subscribe(gameData, () => {
    dismissHint()
})
