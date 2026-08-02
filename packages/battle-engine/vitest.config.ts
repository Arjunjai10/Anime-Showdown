import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@anime-showdown/shared-types': resolve(__dirname, '../shared-types/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
