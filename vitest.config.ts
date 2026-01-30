import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.DEPRECATED.ts'],
    globals: true,
    globalSetup: ['tests/globalSetup.ts'],
  },
})
