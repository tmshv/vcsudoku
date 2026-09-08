import { useSnapshot } from "valtio"
import { Board } from "./components/Board"
import { HintPanel } from "./components/HintPanel"
import { NumberPad } from "./components/NumberPad"
import { SettingsPanel } from "./components/SettingsPanel"
import { StatusBar } from "./components/StatusBar"
import { findState } from "./store/findStore"
import { fillCandidateNotes, fillLastDigit } from "./store/gameStore"
import { hintState, showHint } from "./store/hintStore"
import { getOverlay, jumpState } from "./store/jumpStore"
import { settings } from "./store/settingsStore"
import { useGame } from "./useGame"

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
}

function App() {
    const game = useGame()
    const jump = useSnapshot(jumpState)
    const find = useSnapshot(findState)
    const hint = useSnapshot(hintState)
    const settingsSnap = useSnapshot(settings)

    return (
        <>
            <div className="app">
                <div className="app-header">
                    <h1>Sudoku</h1>
                    <div className="timer">{formatTime(game.elapsed)}</div>
                    {settingsSnap.countMistakes && (
                        <div
                            className="mistakes"
                            title={`${game.mistakes} mistake${game.mistakes === 1 ? "" : "s"}`}
                        >
                            ✕ {game.mistakes}
                        </div>
                    )}
                    {game.notesMode && <div className="notes-badge">Notes</div>}
                    <div className="spacer" />
                    <SettingsPanel
                        difficulty={game.difficulty}
                        customCells={game.customCells}
                        onNewGame={game.newGame}
                    />
                </div>

                <Board
                    board={game.board}
                    initial={game.initial}
                    selected={game.selected}
                    errors={game.errors}
                    notes={game.notes}
                    onSelectCell={game.selectCell}
                    overlay={jump.active ? getOverlay : undefined}
                    hintStep={
                        !jump.active && !find.active
                            ? hint.hint?.steps[hint.step]
                            : undefined
                    }
                />

                {!jump.active && !find.active && <HintPanel />}

                <NumberPad
                    onNumber={(n) =>
                        game.notesMode
                            ? game.toggleNote(n)
                            : game.placeNumber(n)
                    }
                    onClear={game.clearCell}
                    onUndo={game.undo}
                    onRedo={game.redo}
                    onHint={showHint}
                    onFillCell={fillCandidateNotes}
                    onFillLast={fillLastDigit}
                    undoDisabled={!game.canUndo}
                    redoDisabled={!game.canRedo}
                    notesMode={game.notesMode}
                    onToggleNotesMode={game.toggleNotesMode}
                    board={game.board}
                    errors={game.errors}
                    won={game.won}
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
        </>
    )
}

export default App
