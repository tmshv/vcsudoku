/// <reference types="vitest/config" />

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
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
                    { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            },
        }),
    ],
    test: {
        environment: "jsdom",
        coverage: {
            provider: "v8",
            reporter: ["text", "json-summary", "json"],
            reportOnFailure: true,
        },
    },
})
