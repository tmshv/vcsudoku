import { defineConfig } from "@vite-pwa/assets-generator/config"

// Brand colour of the icon background — must match the `rect` fill in
// public/icon.svg so flattened corners blend seamlessly into the artwork.
const BACKGROUND = "#344861"

export default defineConfig({
    images: ["public/icon.svg"],
    preset: {
        transparent: {
            sizes: [64, 192, 512],
            favicons: [[64, "favicon.ico"]],
        },
        maskable: {
            sizes: [512],
            // Android crops maskable icons to arbitrary shapes, so keep the
            // preset's 30% safe zone but pad with the brand colour, not white.
            resizeOptions: { background: BACKGROUND },
        },
        apple: {
            sizes: [180],
            // iOS draws its own rounded-corner mask over the home screen icon.
            // The default preset pads by 30% onto a white plate, which makes
            // the artwork float in a white tile. Bleed to the edges instead.
            padding: 0,
            resizeOptions: { background: BACKGROUND },
        },
    },
})
