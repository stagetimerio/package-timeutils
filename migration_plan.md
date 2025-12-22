# TypeScript Migration Plan for @stagetimerio/timeutils

## Overview
Migrate the timeutils library from JavaScript to TypeScript with:
- Strict mode enabled from the start
- tsup for bundling (replaces manual esbuild scripts)
- Declaration files (.d.ts) for package consumers
- Tests converted to TypeScript

## Current State
- **20 source files** (18 utilities + 2 deprecated + index.js)
- **17 test files** using Jest + Chai
- **Build**: Manual esbuild scripts for CJS/ESM dual output
- **Some JSDoc types already exist** (parseDate, formatTimeOfDay, getTimezoneOffset, etc.)

## Decisions
- **Directory structure**: Move source files to `src/` directory
- **Deprecated files**: Migrate with proper TypeScript types
- **Untested file**: Migrate and keep the `.UNTESTED` suffix

---

## Migration Steps

### Phase 1: Setup TypeScript & tsup

**1.1 Install dependencies**
```bash
npm install -D typescript tsup @types/node
```

**1.2 Create `tsconfig.json`** (strict mode)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**1.3 Create `tsup.config.ts`**
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
})
```

**1.4 Create `src/` directory structure**
- Move all source files from root to `src/`
- Keep `tests/` in place

---

### Phase 2: Define Shared Types

**2.1 Create `src/types.ts`** with common interfaces:
```typescript
export interface HMS {
  hours: number
  minutes: number
  seconds: number
  decimals: number
}

export interface DHMS extends HMS {
  negative: number  // 0 or 1 (boolean-like)
  days: number
}

export type TimeFormat = '12h' | '12h_a' | '24h'
export type SecondsDisplay = 'always' | 'nonzero' | 'never'
export type CountdownFormat = 'default' | 'hms' | 'hm' | 'ms' | 'dhms' | 'dhm' | 'dh'
```

---

### Phase 3: Convert Source Files (.js → .ts)

Convert files in dependency order (leaf files first):

**Group 1: Pure utilities (no internal deps)**
- `isValidDate.js` → `src/isValidDate.ts`
- `isValidTimezone.js` → `src/isValidTimezone.ts`
- `abbreviations.js` → `src/abbreviations.ts`
- `countdownFormats.js` → `src/countdownFormats.ts`

**Group 2: Time conversion utilities**
- `millisecondsToHms.js` → `src/millisecondsToHms.ts`
- `hmsToMilliseconds.js` → `src/hmsToMilliseconds.ts`
- `millisecondsToDhms.js` → `src/millisecondsToDhms.ts`
- `dhmsToMilliseconds.js` → `src/dhmsToMilliseconds.ts`
- `dhmsToDigits.js` → `src/dhmsToDigits.ts`

**Group 3: Timezone utilities**
- `getTimezoneOffset.js` → `src/getTimezoneOffset.ts`
- `formatTimezone.js` → `src/formatTimezone.ts`
- `dateToTimezone.UNTESTED.js` → `src/dateToTimezone.UNTESTED.ts`

**Group 4: Date utilities**
- `getToday.js` → `src/getToday.ts`
- `getTomorrow.js` → `src/getTomorrow.ts`
- `parseDate.js` → `src/parseDate.ts`
- `parseDateAsToday.js` → `src/parseDateAsToday.ts`
- `isSameDay.js` → `src/isSameDay.ts`
- `applyDate.js` → `src/applyDate.ts`
- `moveAfter.js` → `src/moveAfter.ts`
- `formatTimeOfDay.js` → `src/formatTimeOfDay.ts`

**Group 5: Deprecated (with proper types)**
- `timerToStartDate.DEPRECATED.js` → `src/timerToStartDate.DEPRECATED.ts`
- `timerToFinishDate.DEPRECATED.js` → `src/timerToFinishDate.DEPRECATED.ts`

**Group 6: Entry point**
- `index.js` → `src/index.ts` (update imports to .ts, remove .js extensions)

---

### Phase 4: Setup TypeScript Testing

**4.1 Install test dependencies**
```bash
npm install -D ts-jest @types/jest @types/chai
```

**4.2 Update `tests/jest.config.js` → `tests/jest.config.ts`**
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
}

export default config
```

**4.3 Create `tests/tsconfig.json`** (extends main config)
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": ".."
  },
  "include": ["./**/*", "../src/**/*"]
}
```

**4.4 Convert test files (.js → .ts)**
- Update imports: `../index.js` → `../src/index`
- Add type annotations where needed for test data

Test files to convert:
- `tests/applyDate.test.js` → `.ts`
- `tests/dhmsToMilliseconds.test.js` → `.ts`
- `tests/formatTimeOfDay.test.js` → `.ts`
- `tests/formatTimezones.test.js` → `.ts`
- `tests/getTimezoneOffset.test.js` → `.ts`
- `tests/getToday.test.js` → `.ts`
- `tests/getTomorrow.test.js` → `.ts`
- `tests/hmsToMilliseconds.test.js` → `.ts`
- `tests/isSameDay.test.js` → `.ts`
- `tests/isValidDate.test.js` → `.ts`
- `tests/isValidTimezone.test.js` → `.ts`
- `tests/millisecondsToDhms.test.js` → `.ts`
- `tests/millisecondsToHms.test.js` → `.ts`
- `tests/moveAfter.test.js` → `.ts`
- `tests/parseDate.test.js` → `.ts`
- `tests/parseDateAsToday.test.js` → `.ts`
- `tests/timerToFinishDate.test.DEPRECATED.js` → `.ts`
- `tests/timerToStartDate.test.DEPRECATED.js` → `.ts`
- `tests/jest.config.js` → `.ts`

---

### Phase 5: Update package.json

**5.1 Update scripts**
```json
{
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    "test": "npm run test:UTC; npm run test:LA; npm run test:BER; npm run test:SYD",
    "test:UTC": "TZ='UTC' NODE_OPTIONS=--experimental-vm-modules jest --config=tests/jest.config.ts",
    "test:LA": "TZ='America/Los_Angeles' NODE_OPTIONS=--experimental-vm-modules jest --config=tests/jest.config.ts",
    "test:BER": "TZ='Europe/Berlin' NODE_OPTIONS=--experimental-vm-modules jest --config=tests/jest.config.ts",
    "test:SYD": "TZ='Australia/Sydney' NODE_OPTIONS=--experimental-vm-modules jest --config=tests/jest.config.ts",
    "test:ci": "jest --ci --config=tests/jest.config.ts",
    "prepublishOnly": "npm run typecheck && npm run build"
  }
}
```

**5.2 Update exports**
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "files": ["dist", "README.md"]
}
```

**5.3 Remove old devDependencies**
- Remove `esbuild` (replaced by tsup which includes it)

---

### Phase 6: Cleanup & Verification

1. Delete old root-level `.js` source files (after moving to `src/`)
2. Update `.gitignore` if needed
3. Run `npm run typecheck` - fix any type errors
4. Run `npm run build` - verify output structure
5. Run `npm test` - ensure all tests pass in all timezones
6. Verify `dist/` contains:
   - `index.js` (CJS)
   - `index.mjs` (ESM)
   - `index.d.ts` / `index.d.mts` (declarations)

---

## File Changes Summary

| Action | Files |
|--------|-------|
| Create | `tsconfig.json`, `tsup.config.ts`, `src/types.ts`, `tests/tsconfig.json` |
| Move & Rename | 20 source files: `*.js` → `src/*.ts` |
| Rename | 17+ test files: `tests/*.test.js` → `tests/*.test.ts` |
| Update | `package.json`, `tests/jest.config.js` → `.ts` |
| Delete | Root `.js` files (after migration), remove esbuild dep |

---

## Verification Checklist

After each file conversion:
- [ ] `npm run typecheck` passes
- [ ] `npm run test:UTC` passes (fast check)

After all conversions:
- [ ] `npm run build` succeeds
- [ ] `npm test` passes in all 4 timezones
- [ ] `dist/` contains .js, .mjs, .d.ts, .d.mts files
- [ ] Types are exported correctly (test import in another project)
