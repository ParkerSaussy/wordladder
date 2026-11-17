/**
 * Word Ladder
 * Copyright (c) Parker & Gordon Saussy. All rights reserved.
 * This code and the Word Ladder game concept/design are credited to
 * Gordon Saussy and Parker Saussy. Built with React & Vercel.
 * See the LICENSE file for usage terms.
 */

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
})
