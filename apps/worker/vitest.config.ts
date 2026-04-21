import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '/tmp/line-harness-worker-vitest-cache',
  test: {
    globals: true,
  },
});

