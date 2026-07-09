import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // User/organization Pages site (DOli4.github.io) serves from the domain
  // root, so base stays '/'. (A project page would need '/<repo>/'.)
  base: '/',
  plugins: [react()],
})
