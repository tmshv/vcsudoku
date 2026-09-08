import { type Board, isValidPlacement } from "./sudoku"

export interface HintCell {
    row: number
    col: number
}

export interface HintUnit {
    type: "row" | "column" | "box"
    index: number
}

export interface CandidateMark extends HintCell {
    value: number
}

/** A self-contained proof frame. Candidates are computed, never user notes. */
export interface HintStep {
    title: string
    explanation: string
    units: readonly HintUnit[]
    focus: readonly HintCell[]
    evidence: readonly HintCell[]
    excluded: readonly HintCell[]
    candidates: readonly CandidateMark[]
    emphasized: readonly CandidateMark[]
    eliminated: readonly CandidateMark[]
}

export interface Hint {
    kind: "placement" | "elimination" | "conflict" | "stuck" | "reveal"
    cell?: HintCell
    value?: number
    strategy: string
    explanation: string
    steps: HintStep[]
}

export type CandidateGrid = number[][][]
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const cells: HintCell[] = Array.from({ length: 81 }, (_, i) => ({
    row: Math.floor(i / 9),
    col: i % 9,
}))
const units: HintUnit[] = (["row", "column", "box"] as const).flatMap((type) =>
    Array.from({ length: 9 }, (_, index) => ({ type, index })),
)

export function inUnit(cell: HintCell, unit: HintUnit): boolean {
    if (unit.type === "row") return cell.row === unit.index
    if (unit.type === "column") return cell.col === unit.index
    return (
        Math.floor(cell.row / 3) * 3 + Math.floor(cell.col / 3) === unit.index
    )
}

function same(a: HintCell, b: HintCell) {
    return a.row === b.row && a.col === b.col
}

function cellUnits(cell: HintCell): HintUnit[] {
    return [
        { type: "row", index: cell.row },
        { type: "column", index: cell.col },
        {
            type: "box",
            index: Math.floor(cell.row / 3) * 3 + Math.floor(cell.col / 3),
        },
    ]
}

function sees(a: HintCell, b: HintCell) {
    return !same(a, b) && cellUnits(a).some((unit) => inUnit(b, unit))
}

function name(cell: HintCell) {
    return `R${cell.row + 1}C${cell.col + 1}`
}

function unitName(unit: HintUnit) {
    return `${unit.type} ${unit.index + 1}`
}

function unique(list: HintCell[]): HintCell[] {
    return list.filter(
        (cell, i) => list.findIndex((other) => same(cell, other)) === i,
    )
}

function frame(
    title: string,
    explanation: string,
    data: Partial<HintStep> = {},
): HintStep {
    return {
        title,
        explanation,
        units: [],
        focus: [],
        evidence: [],
        excluded: [],
        candidates: [],
        emphasized: [],
        eliminated: [],
        ...data,
    }
}

export function getCandidates(
    board: Board,
    row: number,
    col: number,
): number[] {
    if (board[row][col] !== 0) return []
    return digits.filter((n) => isValidPlacement(board, row, col, n))
}

export function getCandidateGrid(board: Board): CandidateGrid {
    return board.map((row, r) => row.map((_, c) => getCandidates(board, r, c)))
}

function marks(
    grid: CandidateGrid,
    positions: HintCell[],
    values = digits,
): CandidateMark[] {
    return positions.flatMap((cell) =>
        grid[cell.row][cell.col]
            .filter((value) => values.includes(value))
            .map((value) => ({ ...cell, value })),
    )
}

function single(
    board: Board,
    grid: CandidateGrid,
    type?: HintUnit["type"],
): Hint | null {
    if (!type) {
        for (const cell of cells) {
            const options = grid[cell.row][cell.col]
            if (options.length !== 1) continue
            const value = options[0]
            const related = cellUnits(cell)
            const evidence = cells.filter(
                (other) =>
                    sees(cell, other) && board[other.row][other.col] !== 0,
            )
            const present = [
                ...new Set(
                    evidence.map((other) => board[other.row][other.col]),
                ),
            ].sort()
            const explanation = `Only ${value} remains in ${name(cell)}. Its row, column and box together exclude ${present.join(", ") || "no digits directly"}.${present.length < 8 ? " The earlier candidate exclusions rule out the remaining alternatives." : ""}`
            return {
                kind: "placement",
                cell,
                value,
                strategy: "naked single",
                explanation,
                steps: [
                    frame(
                        "Look at the intersecting units",
                        `Inspect ${name(cell)} and its row, column and box. Which digits are already used by its peers?`,
                        { units: related, focus: [cell] },
                    ),
                    frame("One candidate remains", explanation, {
                        units: related,
                        focus: [cell],
                        evidence,
                        candidates: marks(grid, [cell]),
                    }),
                    frame(
                        "Place the digit",
                        `Place ${value} in ${name(cell)}: every other candidate has been ruled out.`,
                        {
                            units: related,
                            focus: [cell],
                            candidates: marks(grid, [cell]),
                        },
                    ),
                ],
            }
        }
        return null
    }
    for (const unit of units.filter((item) => item.type === type)) {
        const members = cells.filter((cell) => inUnit(cell, unit))
        for (const value of digits) {
            const possible = members.filter((cell) =>
                grid[cell.row][cell.col].includes(value),
            )
            if (possible.length !== 1) continue
            const cell = possible[0]
            const excluded = members.filter(
                (other) =>
                    board[other.row][other.col] === 0 && !same(other, cell),
            )
            const evidence = unique(
                excluded.flatMap((other) =>
                    cells.filter(
                        (peer) =>
                            sees(other, peer) &&
                            board[peer.row][peer.col] === value,
                    ),
                ),
            )
            const crossing = units.filter(
                (other) =>
                    evidence.some((peer) => inUnit(peer, other)) &&
                    excluded.some((peer) => inUnit(peer, other)),
            )
            const explanation = `${value} has only one possible position in ${unitName(unit)}: ${name(cell)}. Filled cells are unavailable; the other empty cells are blocked by a highlighted ${value} or by an earlier candidate exclusion.`
            return {
                kind: "placement",
                cell,
                value,
                strategy: `hidden single in ${type}`,
                explanation,
                steps: [
                    frame(
                        "Find a place for the digit",
                        `Where can ${value} go in ${unitName(unit)}? Check its empty cells against the crossing rows, columns and boxes.`,
                        { units: [unit] },
                    ),
                    frame("Rule out the other positions", explanation, {
                        units: [unit, ...crossing],
                        focus: [cell],
                        evidence,
                        excluded,
                        candidates: marks(grid, [cell], [value]),
                    }),
                    frame(
                        "Place the digit",
                        `Place ${value} in ${name(cell)}. It is the only place for ${value} in ${unitName(unit)}.`,
                        {
                            units: [unit],
                            focus: [cell],
                            candidates: marks(grid, [cell], [value]),
                        },
                    ),
                ],
            }
        }
    }
    return null
}

export function findNakedSingle(board: Board): Hint | null {
    return single(board, getCandidateGrid(board))
}
export function findHiddenSingleInRow(board: Board): Hint | null {
    return single(board, getCandidateGrid(board), "row")
}
export function findHiddenSingleInColumn(board: Board): Hint | null {
    return single(board, getCandidateGrid(board), "column")
}
export function findHiddenSingleInBox(board: Board): Hint | null {
    return single(board, getCandidateGrid(board), "box")
}

export interface Deduction {
    strategy: string
    steps: HintStep[]
    eliminations: CandidateMark[]
}

function deduction(
    strategy: string,
    explanation: string,
    grid: CandidateGrid,
    areas: HintUnit[],
    focus: HintCell[],
    patternDigits: number[],
    eliminations: CandidateMark[],
): Deduction | null {
    if (!eliminations.length) return null
    const affected = unique(eliminations)
    const values = [...new Set(eliminations.map((mark) => mark.value))].sort()
    const candidates = marks(
        grid,
        cells.filter((cell) => areas.some((unit) => inUnit(cell, unit))),
    )
    const emphasized = marks(grid, focus, patternDigits)
    return {
        strategy,
        eliminations,
        steps: [
            frame(strategy, explanation, {
                units: areas,
                focus,
                candidates,
                emphasized,
            }),
            frame(
                "Exclude candidates",
                `Remove ${values.join(", ")} only where crossed out: ${affected.map(name).join(", ")}. ${explanation}`,
                {
                    units: areas,
                    focus,
                    excluded: affected,
                    candidates,
                    emphasized,
                    eliminated: eliminations,
                },
            ),
        ],
    }
}

/** Pointing (box → line) and claiming (line → box). */
export function findLockedCandidates(grid: CandidateGrid): Deduction | null {
    for (const source of units) {
        for (const value of digits) {
            const positions = cells.filter(
                (cell) =>
                    inUnit(cell, source) &&
                    grid[cell.row][cell.col].includes(value),
            )
            if (positions.length < 2) continue
            for (const target of units) {
                if ((source.type === "box") === (target.type === "box"))
                    continue
                if (!positions.every((cell) => inUnit(cell, target))) continue
                const eliminations = marks(
                    grid,
                    cells.filter(
                        (cell) => inUnit(cell, target) && !inUnit(cell, source),
                    ),
                    [value],
                )
                const result = deduction(
                    source.type === "box"
                        ? "Pointing candidates"
                        : "Claiming candidates",
                    `In ${unitName(source)}, every possible ${value} lies in ${unitName(target)} (${positions.map(name).join(", ")}). That ${value} must occupy the intersection, so the rest of ${unitName(target)} cannot contain ${value}.`,
                    grid,
                    [source, target],
                    positions,
                    [value],
                    eliminations,
                )
                if (result) return result
            }
        }
    }
    return null
}

function combinations<T>(items: T[], count: number): T[][] {
    if (count === 0) return [[]]
    return items.flatMap((item, i) =>
        combinations(items.slice(i + 1), count - 1).map((rest) => [
            item,
            ...rest,
        ]),
    )
}

/** Naked / hidden pairs and triples, including triples with unequal candidate sets. */
export function findSubset(
    grid: CandidateGrid,
    size: 2 | 3,
    hidden = false,
): Deduction | null {
    for (const unit of units) {
        const members = cells.filter(
            (cell) => inUnit(cell, unit) && grid[cell.row][cell.col].length > 0,
        )
        if (hidden) {
            for (const values of combinations(digits, size)) {
                if (
                    !values.every((value) =>
                        members.some((cell) =>
                            grid[cell.row][cell.col].includes(value),
                        ),
                    )
                )
                    continue
                const focus = members.filter((cell) =>
                    grid[cell.row][cell.col].some((value) =>
                        values.includes(value),
                    ),
                )
                if (focus.length !== size) continue
                const removed = digits.filter(
                    (value) => !values.includes(value),
                )
                const result = deduction(
                    `Hidden ${size === 2 ? "pair" : "triple"}`,
                    `In ${unitName(unit)}, ${values.join(", ")} occur only in ${focus.map(name).join(", ")}. These ${size} cells must hold those ${size} digits, so their other candidates can be removed.`,
                    grid,
                    [unit],
                    focus,
                    values,
                    marks(grid, focus, removed),
                )
                if (result) return result
            }
        } else {
            const eligible = members.filter(
                (cell) => grid[cell.row][cell.col].length <= size,
            )
            for (const focus of combinations(eligible, size)) {
                const values = [
                    ...new Set(
                        focus.flatMap((cell) => grid[cell.row][cell.col]),
                    ),
                ].sort()
                if (values.length !== size) continue
                const other = members.filter(
                    (cell) => !focus.some((item) => same(item, cell)),
                )
                const result = deduction(
                    `Naked ${size === 2 ? "pair" : "triple"}`,
                    `${focus.map(name).join(", ")} in ${unitName(unit)} have only ${values.join(", ")} between them. These ${size} digits are reserved for those ${size} cells and can be removed from the other cells in this unit.`,
                    grid,
                    [unit],
                    focus,
                    values,
                    marks(grid, other, values),
                )
                if (result) return result
            }
        }
    }
    return null
}

export function findXWing(grid: CandidateGrid): Deduction | null {
    for (const type of ["row", "column"] as const) {
        for (const value of digits) {
            const lines = units
                .filter((unit) => unit.type === type)
                .map((unit) => ({
                    unit,
                    positions: cells.filter(
                        (cell) =>
                            inUnit(cell, unit) &&
                            grid[cell.row][cell.col].includes(value),
                    ),
                }))
                .filter((line) => line.positions.length === 2)
            for (const [a, b] of combinations(lines, 2)) {
                const crossType = type === "row" ? "column" : "row"
                const cross: HintUnit[] = a.positions.map((cell) => ({
                    type: crossType,
                    index: type === "row" ? cell.col : cell.row,
                }))
                if (
                    !b.positions.every((cell) =>
                        cross.some((unit) => inUnit(cell, unit)),
                    )
                )
                    continue
                const focus = [...a.positions, ...b.positions]
                const other = cells.filter(
                    (cell) =>
                        cross.some((unit) => inUnit(cell, unit)) &&
                        !inUnit(cell, a.unit) &&
                        !inUnit(cell, b.unit),
                )
                const result = deduction(
                    "X-Wing",
                    `In ${unitName(a.unit)} and ${unitName(b.unit)}, ${value} is confined to ${cross.map(unitName).join(" and ")}. Each base ${type} needs one ${value}; together they occupy both crossing ${crossType}s. Remove ${value} from the rest of those crossing units.`,
                    grid,
                    [a.unit, b.unit, ...cross],
                    focus,
                    [value],
                    marks(grid, other, [value]),
                )
                if (result) return result
            }
        }
    }
    return null
}

function problem(board: Board, grid: CandidateGrid): Hint | null {
    for (const unit of units) {
        for (const value of digits) {
            const repeated = cells.filter(
                (cell) =>
                    inUnit(cell, unit) && board[cell.row][cell.col] === value,
            )
            if (repeated.length > 1) {
                const explanation = `${value} appears more than once in ${unitName(unit)} (${repeated.map(name).join(", ")}). Correct a conflicting entry before looking for the next digit.`
                return {
                    kind: "conflict",
                    strategy: "Repeated digit",
                    explanation,
                    steps: [
                        frame("Resolve the conflict", explanation, {
                            units: [unit],
                            evidence: repeated,
                        }),
                    ],
                }
            }
        }
    }
    const blocked = cells.find(
        (cell) =>
            board[cell.row][cell.col] === 0 &&
            grid[cell.row][cell.col].length === 0,
    )
    if (blocked) {
        const explanation = `${name(blocked)} has no possible digit under the current entries and candidate exclusions. Recheck its row, column and box or undo your last move.`
        return {
            kind: "conflict",
            strategy: "No candidates",
            explanation,
            steps: [
                frame("Resolve the contradiction", explanation, {
                    units: cellUnits(blocked),
                    focus: [blocked],
                    evidence: cells.filter(
                        (cell) =>
                            sees(cell, blocked) &&
                            board[cell.row][cell.col] !== 0,
                    ),
                }),
            ],
        }
    }
    for (const unit of units) {
        const members = cells.filter((cell) => inUnit(cell, unit))
        const missing = digits.find(
            (value) =>
                !members.some(
                    (cell) =>
                        board[cell.row][cell.col] === value ||
                        grid[cell.row][cell.col].includes(value),
                ),
        )
        if (missing) {
            const explanation = `${unitName(unit)} has no place for ${missing}. Recheck the entries or undo your last move before continuing.`
            return {
                kind: "conflict",
                strategy: "Missing position",
                explanation,
                steps: [
                    frame("Resolve the contradiction", explanation, {
                        units: [unit],
                    }),
                ],
            }
        }
    }
    return null
}

/** No solution values derive a move. Optional solution is only an error check. */
export function getHint(board: Board, solution?: Board): Hint | null {
    const grid = getCandidateGrid(board)
    const conflict = problem(board, grid)
    if (conflict) return conflict
    if (solution) {
        const wrong = cells.filter(
            (cell) =>
                board[cell.row][cell.col] !== 0 &&
                board[cell.row][cell.col] !== solution[cell.row][cell.col],
        )
        if (wrong.length) {
            const explanation = `The highlighted entries differ from this puzzle's saved solution. This is a solution check, not a logical deduction. Recheck them or undo before continuing.`
            return {
                kind: "conflict",
                strategy: "Check your entries",
                explanation,
                steps: [
                    frame("Check your entries", explanation, {
                        evidence: wrong,
                    }),
                ],
            }
        }
    }
    if (!board.some((row) => row.includes(0))) return null
    const steps: HintStep[] = []
    // Every iteration removes at least one candidate. At most 729 can exist.
    while (true) {
        const move =
            single(board, grid) ??
            single(board, grid, "box") ??
            single(board, grid, "row") ??
            single(board, grid, "column")
        if (move) return { ...move, steps: [...steps, ...move.steps] }
        const next =
            findLockedCandidates(grid) ??
            findSubset(grid, 2) ??
            findSubset(grid, 2, true) ??
            findSubset(grid, 3) ??
            findSubset(grid, 3, true) ??
            findXWing(grid)
        if (!next) break
        steps.push(...next.steps)
        for (const mark of next.eliminations) {
            grid[mark.row][mark.col] = grid[mark.row][mark.col].filter(
                (value) => value !== mark.value,
            )
        }
        const contradiction = problem(board, grid)
        if (contradiction)
            return {
                ...contradiction,
                steps: [...steps, ...contradiction.steps],
            }
    }
    const explanation =
        "No digit can be determined with the supported techniques: singles, pointing / claiming, naked / hidden pairs and triples, and X-Wing. This does not mean the puzzle requires guessing. You can explicitly reveal a digit from the saved solution."
    return {
        kind: steps.length ? "elimination" : "stuck",
        strategy: "No further logical step",
        explanation,
        steps: [...steps, frame("No further logical step", explanation)],
    }
}

/** Explicit answer reveal, deliberately separate from logical hint search. */
export function revealHint(
    board: Board,
    solution: Board,
    selected?: HintCell | null,
): Hint | null {
    const cell =
        selected && board[selected.row][selected.col] === 0
            ? selected
            : cells.find((item) => board[item.row][item.col] === 0)
    if (!cell) return null
    const value = solution[cell.row][cell.col]
    const explanation = `The saved solution has ${value} in ${name(cell)}. This reveals an answer; it is not a logical deduction.`
    return {
        kind: "reveal",
        cell,
        value,
        strategy: "Answer reveal",
        explanation,
        steps: [
            frame("Answer reveal", explanation, {
                focus: [cell],
                candidates: [{ ...cell, value }],
            }),
        ],
    }
}
