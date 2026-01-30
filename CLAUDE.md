# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run build          # Build both CJS and ESM bundles via tsdown
npm run typecheck      # Run TypeScript type checking
npm test               # Run tests across 4 timezones (UTC, LA, Berlin, Sydney)
npm run test:UTC       # Run tests in UTC only (fastest for development)
npm run test:ci        # Run tests once without timezone variations (CI mode)
```

To run a single test file:
```bash
TZ='UTC' npx vitest run tests/millisecondsToHms.test.ts
```

## Architecture

This is a timer utility library for stagetimer.io that handles time conversions and timezone operations. It's written in TypeScript with dual CJS/ESM distribution via tsdown.

**Key patterns:**
- Each utility is a single file with a default export (e.g., `millisecondsToHms.ts`)
- Named exports are used for utilities with multiple functions (e.g., `formatTimeOfDay.ts`)
- All utilities are re-exported from `index.ts`
- Tests use Vitest with Chai assertions
- Tests run in multiple timezones to ensure timezone-safe behavior

**Main dependencies:**
- `date-fns` and `@date-fns/tz` for date/timezone operations

**File naming conventions:**
- `.DEPRECATED.ts` - Deprecated utilities still exported for backwards compatibility
- `.UNTESTED.ts` - Utilities without test coverage
