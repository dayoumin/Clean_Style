import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    globals: true,
    // scripts/experiments and scripts/__tests__ use node:test; run them with `pnpm test:node`.
    exclude: ['**/node_modules/**', '**/tests/**', 'artifacts/**', 'scripts/experiments/**', 'scripts/__tests__/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
