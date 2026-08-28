# Canvas Fireworks Salute on Win

## Context

When a player completes the Sudoku puzzle, the app currently shows a plain win overlay (modal card with "You Win!" message). The request is to add a celebratory canvas-based fireworks animation that plays on top of everything when the player wins.

## Approach

Create a new `Fireworks` React component with a `<canvas>` element. The canvas is fixed full-viewport with `pointer-events: none` so it doesn't block clicks on the "Play Again" button. No new dependencies.

### Animation Design

- Launch **6 rockets** over ~3 seconds (one every ~500ms), each from a random x position at the bottom edge
- Each rocket travels upward to a random height (30–60% from bottom) with slight horizontal drift
- On arrival, each rocket **explodes** into ~30 colored particles in a radial burst
- Particles have: initial radial velocity, gravity pull-down, alpha fade-out, random colors from a vivid palette
- Animation auto-stops once all particles have faded out (~5–6s total)

### Component

New file: `src/components/Fireworks.tsx`

```tsx
function Fireworks({ active }: { active: boolean })
```

- `useEffect` starts animation loop when `active` becomes true
- `useRef<HTMLCanvasElement>` for direct canvas access
- Returns `null` when not active
- Canvas inline style: `position: fixed; inset: 0; z-index: 20; pointer-events: none`
- Canvas sized to `window.innerWidth × window.innerHeight` on mount

### Integration

`src/App.tsx` — add `<Fireworks active={game.won} />` alongside the existing `.win-overlay`:

```tsx
{game.won && (
    <>
        <Fireworks active={game.won} />
        <div className="win-overlay">...</div>
    </>
)}
```

No CSS changes needed (canvas uses inline styles).

## Files to Modify

| File                          | Change                                          |
| ----------------------------- | ----------------------------------------------- |
| `src/components/Fireworks.tsx`| Create — canvas fireworks component             |
| `src/App.tsx`                 | Import and render `<Fireworks active={won} />`  |

## Tasks

### Task 1: Create Fireworks component
- [ ] Create `src/components/Fireworks.tsx`
- [ ] Implement rocket type: `{ x, y, vx, vy, targetY, exploded }`
- [ ] Implement particle type: `{ x, y, vx, vy, alpha, color, radius }`
- [ ] Animate with `requestAnimationFrame`, cancel on cleanup
- [ ] Launch 6 rockets staggered 500ms apart using `setTimeout` refs
- [ ] Stop loop when all particles have faded (alpha <= 0)

### Task 2: Integrate into App.tsx
- [ ] Import `Fireworks` in `src/App.tsx`
- [ ] Render `<Fireworks active={game.won} />` when `game.won` is true

## Verification

1. Run `npm run dev` and complete a puzzle — fireworks should fire
2. Click "Play Again" — fireworks stop and game resets normally
3. Run `npm run lint` — no lint errors
4. Run `npm run test` — all existing tests pass (no new tests needed for canvas animation)
