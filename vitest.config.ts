import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    globals: true,
    // scripts/experiments uses node:test; run it with `pnpm test:experiments`.
    exclude: ['**/node_modules/**', '**/tests/**', 'artifacts/**', 'scripts/experiments/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
