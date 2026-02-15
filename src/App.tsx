import { useSnapshot } from "valtio"
import { Board } from "./components/Board"
import { NumberPad } from "./components/NumberPad"
import { StatusBar } from "./components/StatusBar"
import { getOverlay, jumpState } from "./store/jumpStore"
import type { Difficulty } from "./sudoku"
import { useGame } from "./useGame"

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

function App() {
    const game = useGame()
    const jump = useSnapshot(jumpState)

    return (
        <div className="app">
            <h1>Sudoku</h1>

            <div className="toolbar">
                <div className="difficulty-group">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                        <button
                            type="button"
                            key={d}
                            className={`diff-btn ${game.difficulty === d ? "diff-active" : ""}`}
                            onClick={() => game.newGame(d)}
                        >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="timer">{formatTime(game.elapsed)}</div>
            </div>

            <Board
                board={game.board}
                initial={game.initial}
                selected={game.selected}
                errors={game.errors}
                notes={game.notes}
                onSelectCell={game.selectCell}
                overlay={jump.active ? getOverlay : undefined}
            />

            <NumberPad
                onNumber={(n) =>
                    game.notesMode ? game.toggleNote(n) : game.placeNumber(n)
                }
                onClear={game.clearCell}
                onUndo={game.undo}
                onRedo={game.redo}
                undoDisabled={!game.canUndo}
                redoDisabled={!game.canRedo}
                notesMode={game.notesMode}
                onToggleNotesMode={game.toggleNotesMode}
                board={game.board}
            />

            <StatusBar />

            {game.won && (
                <div className="win-overlay">
                    <div className="win-message">
                        <h2>You Win!</h2>
                        <p>Completed in {formatTime(game.elapsed)}</p>
                        <button
                            type="button"
                            onClick={() => game.newGame(game.difficulty)}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
