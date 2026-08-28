# Dark Theme & CSS Refactoring Plan

## Context

The game uses a mix of CSS custom properties and hardcoded color literals. Before adding dark/light/system theme support, the CSS needs a comprehensive refactoring pass: all colors converted to semantic flat CSS variables, inconsistently-named variables renamed, and new shape variables added for future theme extensibility (border-radius, border widths). A floating settings panel (⚙ gear icon, fixed top-right) provides the theme toggle UI.

## CSS Variable Design

### Renames (existing variables)
| Old name           | New name              |
|--------------------|-----------------------|
| `--box-border`     | `--border-box`        |
| `--color-error-text` | `--color-text-error` |
| `--color-initial`  | `--color-text-initial`|
| `--color-player`   | `--color-text-player` |

### New variables (replacing hardcoded literals)
| Variable                | Light value | Replaces     |
|-------------------------|-------------|--------------|
| `--color-surface`       | `#ffffff`   | `#fff` on panels/buttons |
| `--color-surface-raised`| `#f0f0f0`   | `#f0f0f0` kbd bg |
| `--color-text`          | `#344861`   | `#344861` (headings, h1) |
| `--color-text-muted`    | `#555555`   | `#555` (timer, btn labels) |
| `--color-text-subtle`   | `#666666`   | `#666` (win msg body) |
| `--color-text-secondary`| `#444444`   | `#444` (status text, kbd) |
| `--color-text-faint`    | `#888888`   | `#888` (shortcuts) |
| `--color-text-notes`    | `#7b8ba3`   | `#7b8ba3` (candidate notes) |
| `--color-text-dim`      | `#adb5bd`   | `#adb5bd` (completed digit) |
| `--color-text-on-primary` | `#ffffff` | `#fff` text on primary bg |
| `--color-border`        | `#cccccc`   | `#ccc` (button borders) |
| `--color-border-shadow` | `#bbbbbb`   | `#bbb` (kbd shadow) |
| `--color-primary-hover` | `#1565c0`   | `#1565c0` (win btn hover) |
| `--color-hint`          | `#f57f17`   | `#f57f17` (hint btn text) |
| `--color-hint-border`   | `#f9a825`   | `#f9a825` (hint btn border)|
| `--color-jump-label`    | `#fdd835`   | `#fdd835` (jump overlay bg)|
| `--color-jump-text`     | `#000000`   | `#000` (jump overlay text) |
| `--color-overlay`       | `rgba(0,0,0,0.5)` | win overlay bg |

### New shape variables
| Variable        | Value  | Purpose                     |
|-----------------|--------|-----------------------------|
| `--radius-cell` | `0px`  | cell corner radius          |
| `--radius-btn`  | `6px`  | button corner radius        |
| `--radius-panel`| `12px` | panel/win-message radius    |

### Dark theme overrides (`[data-theme="dark"]`)
```
--color-bg:              #121212
--color-surface:         #1e1e2e
--color-surface-raised:  #2a2a3a
--color-board-bg:        #0d1117
--color-cell:            #1c1c2e
--color-selected:        #1e3a5c
--color-highlighted:     #1a2d3d
--color-same-number:     #252550
--color-error:           #4a1a1a
--color-text:            #c9d1d9
--color-text-muted:      #8b949e
--color-text-subtle:     #6e7681
--color-text-secondary:  #b0bec5
--color-text-faint:      #585f69
--color-text-player:     #79b8ff
--color-text-initial:    #e6edf3
--color-text-error:      #ffa0a0
--color-text-notes:      #5d7a8f
--color-text-dim:        #3d5060
--color-border:          #30363d
--color-border-shadow:   #1c2128
--color-primary:         #388bfd
--color-primary-hover:   #1f6feb
--color-hint:            #e3b341
--color-hint-border:     #d4a017
```

## Theme System Architecture

- `:root` always holds light values
- `[data-theme="dark"]` overrides all color variables
- JS (themeStore) always sets `data-theme="light"` or `data-theme="dark"` on `<html>` — never "system"
- When user selects "system", the store reads `window.matchMedia('(prefers-color-scheme: dark)').matches` and applies the appropriate resolved value
- A `change` listener on the media query re-applies when the OS preference changes while in system mode
- localStorage key: `'vcsudoku-theme'` stores `'system' | 'light' | 'dark'`

## Settings Panel Design

- Fixed `⚙` button: `position: fixed; top: 16px; right: 16px`
- Click toggles panel open/close; click outside closes
- Panel appears below the gear button (top-right aligned)
- Panel content: "Theme" heading + three pill buttons: **System** / **Light** / **Dark**
- Active pill: `background: var(--color-primary); color: var(--color-text-on-primary)`
- Panel uses CSS variables throughout, so it automatically reflects both themes

## Files

| File                               | Action      |
|------------------------------------|-------------|
| `src/index.css`                    | Refactor + add dark theme + settings panel styles |
| `src/store/themeStore.ts`          | Create      |
| `src/components/SettingsPanel.tsx` | Create      |
| `src/App.tsx`                      | Add `<SettingsPanel />` |

## Tasks

### Task 1: CSS variable refactoring
- [ ] Reorganize `:root` into sections with comments: Layout, Shape, Backgrounds, Cell States, Text, Borders, Accents
- [ ] Rename existing variables: `--box-border` → `--border-box`, `--color-error-text` → `--color-text-error`, `--color-initial` → `--color-text-initial`, `--color-player` → `--color-text-player`
- [ ] Add all new variables from the table above
- [ ] Add shape variables: `--radius-cell`, `--radius-btn`, `--radius-panel`
- [ ] Update all CSS property references to use new variable names (e.g., replace `var(--box-border)` → `var(--border-box)`, replace `#ccc` → `var(--color-border)`, etc.)

### Task 2: Dark theme CSS
- [ ] Add `[data-theme="dark"]` block to `index.css` with all color overrides from the table above

### Task 3: Theme store (`src/store/themeStore.ts`)
- [ ] Define `type Theme = 'system' | 'light' | 'dark'`
- [ ] Create Valtio proxy `themeState: { theme: Theme }`; initialize from localStorage or default to `'system'`
- [ ] Implement `applyTheme(theme)`: resolves system → reads `matchMedia`, sets `data-theme="light"|"dark"` on `document.documentElement`
- [ ] Implement `setTheme(theme)`: updates proxy, saves to localStorage, calls `applyTheme()`
- [ ] Register `matchMedia.addEventListener('change', ...)` to re-apply when in system mode
- [ ] Call `applyTheme(themeState.theme)` at module load

### Task 4: Settings panel component (`src/components/SettingsPanel.tsx`)
- [ ] Render fixed `⚙` gear button (top-right)
- [ ] Local `open` state; toggle on gear click, close on outside click (useRef + useEffect)
- [ ] Read `themeState` via `useSnapshot`; render three pill buttons calling `setTheme()`
- [ ] Active pill highlighted with primary color

### Task 5: App integration
- [ ] Import `SettingsPanel` in `App.tsx`
- [ ] Render `<SettingsPanel />` as sibling to `.app` div (it's fixed, so position is independent)

### Task 6: CSS for settings panel
- [ ] Add `.settings-gear` (fixed position button), `.settings-panel` (dropdown), `.theme-option` and `.theme-option-active` styles to `index.css`

### Task 7: Tests (`src/store/themeStore.test.ts`)
- [ ] Test: default theme is `'system'` when localStorage is empty
- [ ] Test: `setTheme('dark')` sets `document.documentElement.dataset.theme` to `'dark'`
- [ ] Test: `setTheme('light')` sets `document.documentElement.dataset.theme` to `'light'`
- [ ] Test: `setTheme('system')` resolves via matchMedia (mock it)
- [ ] Test: localStorage is updated by `setTheme`

## Verification

```
npm run test       # all tests pass
npm run check      # biome lint + format clean
npm run build      # TypeScript + Vite build succeeds
```

Visual: toggle System / Light / Dark in settings panel; verify colors change; reload page and verify preference persists.
