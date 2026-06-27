import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base + HashRouter => works on GitHub Pages under any repo name
// (e.g. /aarya-hub/) without server-side rewrites.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
