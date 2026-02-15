import { useEffect } from "react"
import {
    clearCell,
    moveSelection,
    placeNumber,
    redo,
    toggleNote,
    toggleNotesMode,
    undo,
} from "./store/gameStore"
import { handleKey as jumpHandleKey } from "./store/jumpStore"

export function useKeyboard() {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (jumpHandleKey(e)) return

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") {
                e.preventDefault()
                redo()
                return
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
                e.preventDefault()
                undo()
                return
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault()
                redo()
                return
            }

            const digitMatch = e.code.match(/^Digit([1-9])$/)
            if (digitMatch) {
                const num = Number.parseInt(digitMatch[1], 10)
                if (e.shiftKey) {
                    toggleNote(num)
                } else {
                    placeNumber(num)
                }
            } else if (e.key === "Backspace" || e.key === "Delete") {
                clearCell()
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                moveSelection(-1, 0)
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                moveSelection(1, 0)
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                moveSelection(0, -1)
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                moveSelection(0, 1)
            } else if (e.key === "h") {
                moveSelection(0, -1)
            } else if (e.key === "j") {
                moveSelection(1, 0)
            } else if (e.key === "k") {
                moveSelection(-1, 0)
            } else if (e.key === "l") {
                moveSelection(0, 1)
            } else if (e.key === "n" || e.key === "N") {
                toggleNotesMode()
            }
        }
        window.addEventListener("keydown", handleKey)
        return () => window.removeEventListener("keydown", handleKey)
    }, [])
}
