# Hint walkthroughs

Click **Hint** or press `v`. The panel below the board starts with a place or pattern to examine. **Explain next** (or another `v`) advances through the reasoning; **Back** replays the previous frame. The conclusion offers a separate **Place …** action. Closing the panel or pressing Escape restores the normal board view.

Rows and columns are numbered from the top and left, starting at 1. `R3C7` means row 3, column 7; boxes are numbered 1–9 in reading order. Blue shading shows the units under discussion, blue frames show the focus cells, amber frames identify supporting placed digits, and crosses show excluded positions or candidates. In elimination steps, circled candidates identify the pattern. Candidate displays are computed for the walkthrough and never overwrite pencil notes.

The panel works on touch screens independently of the desktop shortcut bar. Jump/find temporarily suspend its overlays. A digit change, undo/redo that changes the board, or a new/imported puzzle dismisses an old proof. Selection, timer updates and pencil-note edits do not invalidate it.

## What changed after the audit

The original engine implemented naked and hidden singles. If these failed, it chose the empty cell with the fewest candidates and read its answer from the saved solution. Few candidates do not prove which candidate is correct; the resulting suggestion was an answer reveal with no logical justification. Its naked-single explanation also incorrectly said each of the three units contained all other digits, rather than considering the units together. Invalid player entries could feed into subsequent hints. The only explanation appeared in a status bar hidden on touch devices, and repeated requests simply returned the same hint.

## Search and proof model

`src/hint.ts` derives candidates from the current board, independently of player notes. It first checks repeated digits, empty cells without candidates, and missing digits with no position in a unit. When a saved solution is supplied, differing entries are reported explicitly as a **solution check**, not as a logical deduction. This matches the game's existing saved-solution error model.

Search prefers naked singles, then hidden singles in boxes, rows and columns. If no placement is available, it tries:

1. Pointing and claiming candidates (box/line intersections).
2. Naked and hidden pairs.
3. Naked and hidden triples.
4. X-Wing in rows or columns.

Every productive elimination adds two proof frames and removes candidates from an internal grid. Search then restarts with singles. The complete sequence is returned up to the next placement, so later reasoning includes its prerequisites. Each frame captures its units, focus, supporting digits, candidate display and exclusions before the deduction is applied. Replaying frames does not recompute or mutate the puzzle. Every iteration removes at least one candidate, so search terminates without guessing.

The implemented conditions follow the standard definitions documented by HoDoKu: [intersections](https://hodoku.sourceforge.net/en/tech_intersections.php), [naked subsets](https://hodoku.sourceforge.net/en/tech_naked.php), [hidden subsets](https://hodoku.sourceforge.net/en/tech_hidden.php), and [X-Wing](https://hodoku.sourceforge.net/en/tech_fishb.php).

`src/store/hintStore.ts` manages progress and invalidation. Applying a conclusion calls the ordinary placement function, preserving note cleanup, win detection and undo/redo. It rechecks that the board still matches the source of the proof before applying anything.

## Limits

This is a bounded repertoire of human solving techniques, not a claim to explain every Sudoku. If those techniques stop after useful exclusions, those exclusions remain available to inspect in the walkthrough. If no placement follows, the panel states its limit; it never treats that as proof that guessing is necessary. **Reveal an answer** is a separate, explicit action using the selected empty cell (or the first empty cell), labeled as a saved-solution reveal. It still requires a separate placement click. Conflicts do not offer answer reveals.

Candidate exclusions remain local to a walkthrough. They are recomputed after a placement and are not persisted into the player's notes or history. Advanced chains, wings other than X-Wing, larger fish, and uniqueness-based techniques are not implemented.

Tests cover technique fixtures and their transposes, near-miss patterns, invalid boards, 40 deterministic puzzle continuations, candidate soundness against a known solution, independent exhaustive checks that excluded candidates admit no completion, and the complete panel/board/store interaction including keyboard controls and undo.
