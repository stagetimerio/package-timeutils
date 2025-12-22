console.info(`
Timezone
name: '${Intl.DateTimeFormat().resolvedOptions().timeZone}'
offset: '${new Date().getTimezoneOffset()}'
now: '${new Date()}' '${new Date().toISOString()}'
`)

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.DEPRECATED.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
}
