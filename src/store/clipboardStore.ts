import { proxy } from "valtio"

interface ClipboardState {
    copied: boolean
}

export const clipboardState = proxy<ClipboardState>({ copied: false })

export function setCopied() {
    clipboardState.copied = true
    setTimeout(() => {
        clipboardState.copied = false
    }, 2000)
}
