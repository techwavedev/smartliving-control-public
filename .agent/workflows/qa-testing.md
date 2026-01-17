---
description: Run QA tests and testing workflows for SmartLiving Control
---

# QA & Testing Workflow

This workflow covers running tests and quality assurance procedures for the SmartLiving Control application.

## Prerequisites

Ensure dependencies are installed:

```bash
npm install
```

## Unit Tests

// turbo
Run Jest unit tests:

```bash
npm test
```

To run with coverage:

```bash
npm test -- --coverage
```

To run a specific test file:

```bash
npm test -- tests/unit/smartthings.test.js
```

## E2E Tests

// turbo
Run Playwright E2E tests:

```bash
npm run test:e2e
```

**Note**: E2E tests require the Electron app to be buildable. If tests fail, ensure all dependencies are installed.

## Linting

// turbo
Run ESLint on source code:

```bash
npm run lint
```

## Full QA Check

Run all tests and linting in sequence:

```bash
npm run lint && npm test && npm run test:e2e
```

## Test Coverage Targets

- **Unit Tests**: Cover all service methods in `src/services/`
- **E2E Tests**: Cover main user flows (setup, navigation, device control)

## Adding New Tests

### Unit Tests

Add new test files to `tests/unit/` with `.test.js` extension.

### E2E Tests

Add new test files to `tests/e2e/` with `.spec.js` extension.
