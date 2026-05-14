// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__test__/**/*.test.ts'],
    exclude: [
      'node_modules',
      'template/*/**', 
    ],
  },
});
