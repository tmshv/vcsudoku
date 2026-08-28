# PWA + Mobile-Ready Layout

## Context

The game needs to work offline (no network on a plane) and be installable as a PWA on iOS and Android home screens. Currently the project has no service worker, no manifest, no app icons, and the CSS has no safe-area handling or touch optimizations. Deployment target is Vercel (root domain, no base-path complications).

## Approach

Use `vite-plugin-pwa` (Workbox-based, auto-updates) + `@vite-pwa/assets-generator` (generates all icon sizes from a single SVG). Mobile layout is improved via CSS `env(safe-area-inset-*)`, `touch-action: manipulation`, and one small-screen media query.

## Critical Files

- `vite.config.ts` — add VitePWA plugin
- `index.html` — update viewport meta, add apple PWA metas
- `src/index.css` — safe-area padding, touch-action, small-screen tweaks
- `public/icon.svg` — new source icon (create)
- `package.json` — add devDependencies and a `generate-pwa-assets` script
- `README.md` — document PWA install steps

---

## Tasks

### Task 1: Install dependencies
- [ ] `npm install -D vite-plugin-pwa @vite-pwa/assets-generator`

### Task 2: Create source icon
- [ ] Create `public/icon.svg` — minimalist 3×3 Sudoku grid:
  - Dark rounded-rect background (`#344861`)
  - 9 cells in a 3×3 layout; a few cells show white digit glyphs
  - 512×512 viewBox, readable at 16px

### Task 3: Generate icon assets
- [ ] Add `"generate-pwa-assets": "pwa-assets-generator --preset minimal public/icon.svg"` to `package.json` scripts
- [ ] Run `npm run generate-pwa-assets` — produces in `public/`:
  - `pwa-64x64.png`
  - `pwa-192x192.png`
  - `pwa-512x512.png`
  - `maskable-icon-512x512.png`
  - `apple-touch-icon-180x180.png`
  - `favicon.ico`

### Task 4: Configure vite-plugin-pwa
- [ ] Update `vite.config.ts` — add `VitePWA()` to plugins:
  ```ts
  VitePWA({
      registerType: "autoUpdate",
      manifest: {
          name: "Sudoku",
          short_name: "Sudoku",
          description: "A browser-based Sudoku game",
          theme_color: "#344861",
          background_color: "#f5f5f5",
          display: "standalone",
          icons: [
              { src: "pwa-64x64.png",            sizes: "64x64",   type: "image/png" },
              { src: "pwa-192x192.png",           sizes: "192x192", type: "image/png" },
              { src: "pwa-512x512.png",           sizes: "512x512", type: "image/png" },
              { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
      },
      workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
  })
  ```

### Task 5: Update index.html
- [ ] Replace viewport meta:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1" />
  ```
- [ ] Replace `<link rel="icon" href="/vite.svg" ...>` with:
  ```html
  <link rel="icon" type="image/png" sizes="64x64" href="/pwa-64x64.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
  ```
- [ ] Add below the viewport meta:
  ```html
  <meta name="theme-color" content="#344861" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Sudoku" />
  ```

### Task 6: Update src/index.css for mobile
- [ ] Add `touch-action: manipulation` to `button` and `.cell` selectors (eliminates 300ms tap delay on iOS):
  ```css
  button {
      touch-action: manipulation;
  }
  .cell {
      touch-action: manipulation;
  }
  ```
- [ ] Update `.app` to respect safe-area insets:
  ```css
  .app {
      padding: max(20px, env(safe-area-inset-top))
               max(16px, env(safe-area-inset-right))
               max(20px, env(safe-area-inset-bottom))
               max(16px, env(safe-area-inset-left));
  }
  ```
- [ ] Update `.settings-gear` and `.settings-panel` fixed positions:
  ```css
  .settings-gear {
      top: max(16px, env(safe-area-inset-top));
      right: max(16px, env(safe-area-inset-right));
  }
  .settings-panel {
      top: max(60px, calc(env(safe-area-inset-top) + 44px));
      right: max(16px, env(safe-area-inset-right));
  }
  ```
- [ ] Add small-screen media query:
  ```css
  @media (max-width: 380px) {
      .win-message {
          padding: 24px;
          margin: 0 16px;
      }
      .win-message h2 {
          font-size: 1.4rem;
      }
  }
  ```

### Task 7: Update README.md
- [ ] Add "Installing as an app" section with steps for iOS (Safari → Share → Add to Home Screen) and Android (Chrome → menu → Add to Home Screen)

---

## Verification

1. `npm run build` — should complete without errors; check `dist/sw.js` and `dist/manifest.webmanifest` exist
2. `npm run preview` — open in Chrome DevTools → Application → Manifest (check all fields), Service Workers (should be registered), Storage (cache populated after first load)
3. Disable network in DevTools → reload — app should load from cache
4. Lighthouse PWA audit → all PWA checks green
5. On a real iPhone (Safari): visit URL, tap Share → "Add to Home Screen" — should show the Sudoku icon and name; launch standalone (no browser chrome); confirm content doesn't hide behind notch
