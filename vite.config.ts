import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import manifest from './manifest.json'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({  manifest, registerType: 'autoUpdate' })],
})
