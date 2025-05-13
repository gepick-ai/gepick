import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    workspace: [
      'src/*',
      {
        test: {
          dir: "browser",
          environment: 'jsdom',
        },
      },
      {
        test: {
          dir: "common",
          environment: 'node',
        },
      },
      {
        test: {
          dir: "node",
          environment: 'node',
        },
      },
    ],
  },
});
