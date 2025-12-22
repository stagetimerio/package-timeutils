# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run build          # Build both CJS and ESM bundles
npm test               # Run tests across 4 timezones (UTC, LA, Berlin, Sydney)
npm run test:UTC       # Run tests in UTC only (fastest for development)
npm run test:ci        # Run tests once without timezone variations (CI mode)
```

To run a single test file:
```bash
TZ='UTC' NODE_OPTIONS=--experimental-vm-modules npx jest --config=tests/jest.config.js tests/millisecondsToHms.test.js
```

## Architecture

This is a timer utility library for stagetimer.io that handles time conversions and timezone operations. It uses ESM modules with dual CJS/ESM distribution via esbuild.

**Key patterns:**
- Each utility is a single file with a default export (e.g., `millisecondsToHms.js`)
- Named exports are used for utilities with multiple functions (e.g., `formatTimeOfDay.js`)
- All utilities are re-exported from `index.js`
- Tests use Jest with Chai assertions
- Tests run in multiple timezones to ensure timezone-safe behavior

**Main dependencies:**
- `date-fns` and `@date-fns/tz` for date/timezone operations

**File naming conventions:**
- `.DEPRECATED.js` - Deprecated utilities still exported for backwards compatibility
- `.UNTESTED.js` - Utilities without test coverage
