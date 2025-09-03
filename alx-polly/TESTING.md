# Testing Guide

This document provides information about the testing setup and how to run tests for the Alx-Polly application.

## Testing Framework

We use **Jest** as our testing framework with the following setup:

- **Jest** - JavaScript testing framework
- **@types/jest** - TypeScript definitions for Jest
- **jest-environment-jsdom** - DOM environment for testing React components
- **ts-jest** - TypeScript preprocessor for Jest

## Test Scripts

The following npm scripts are available for testing:

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs tests when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are organized in the `__tests__` directory with the following structure:

```
__tests__/
├── lib/
│   └── actions/
│       ├── poll-actions.simple.test.ts      # Basic setup tests
│       └── poll-actions.working.test.ts     # Comprehensive poll action tests
└── setup/
    └── (test utilities and helpers)
```

## Poll Actions Tests

The main test suite covers the `poll-actions.ts` file with comprehensive tests for:

### `createPollAction`

- ✅ Validates required fields (title, options)
- ✅ Validates minimum 2 options required
- ✅ Validates maximum 10 options allowed
- ✅ Creates polls successfully with valid data
- ✅ Handles database errors gracefully
- ✅ Cleans up on partial failures

### `updatePollAction`

- ✅ Validates poll ownership
- ✅ Validates empty title
- ✅ Updates polls successfully
- ✅ Handles database errors

### `deletePollAction`

- ✅ Validates poll ownership
- ✅ Deletes polls successfully
- ✅ Handles authorization errors

### `togglePollStatusAction`

- ✅ Toggles poll active/inactive status
- ✅ Validates ownership
- ✅ Returns new status

### `submitVoteAction`

- ✅ Validates empty options
- ✅ Validates poll is active
- ✅ Validates poll expiration
- ✅ Validates multiple votes setting
- ✅ Handles existing votes properly

## Test Coverage

Current test coverage for poll actions:

- **Statements**: 66.94%
- **Branches**: 62.5%
- **Functions**: 85.71%
- **Lines**: 68.18%

## Mocking Strategy

### Supabase Mocking

```typescript
jest.mock("../../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
  getCurrentUser: jest.fn(),
}));
```

### Next.js Mocking

```typescript
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));
```

## Writing New Tests

### Test File Naming

- Use `.test.ts` or `.test.tsx` for test files
- Place tests in `__tests__` directory
- Mirror the source file structure

### Example Test Structure

```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("functionName", () => {
    it("should handle success case", async () => {
      // Arrange
      const mockData = {
        /* test data */
      };

      // Act
      const result = await functionName(mockData);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should handle error case", async () => {
      // Arrange
      const invalidData = {
        /* invalid data */
      };

      // Act
      const result = await functionName(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Mock Patterns

#### Successful Database Operation

```typescript
mockSupabaseFrom.mockReturnValue({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    }),
  }),
});
```

#### Database Error

```typescript
mockSupabaseFrom.mockReturnValue({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    }),
  }),
});
```

## Best Practices

1. **Clear Test Names**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies**: Mock all external services and APIs
4. **Test Edge Cases**: Include tests for error conditions and edge cases
5. **Clean Up**: Use `beforeEach` to reset mocks between tests
6. **Async Testing**: Properly handle async operations with `await`

## Running Specific Tests

```bash
# Run specific test file
npm test -- poll-actions.working.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="createPollAction"

# Run tests in a specific directory
npm test -- __tests__/lib/actions/
```

## Debugging Tests

### Enable Verbose Output

```bash
npm test -- --verbose
```

### Debug Mode

```bash
npm test -- --detectOpenHandles --forceExit
```

### Watch Mode for Development

```bash
npm run test:watch
```

## Continuous Integration

Tests are designed to run in CI environments. Make sure to:

- Set required environment variables
- Use appropriate timeouts for async operations
- Handle database mocking properly

## Refactoring Updates

The codebase has been comprehensively refactored with a new layered architecture:

### New Architecture

- **Service Layer**: Business logic in `lib/services/`
- **Repository Layer**: Data access in `lib/repositories/`
- **Validation Layer**: Input validation in `lib/validators/`
- **Error Handling**: Custom errors in `lib/errors/`
- **Configuration**: Centralized config in `lib/config/`
- **Authentication**: Auth services in `lib/auth/`

### Updated Tests

- `poll-actions.basic.test.ts` - Architecture validation tests
- `poll-actions.refactored.test.ts` - Service layer tests (when modules are available)
- Legacy tests maintained for backward compatibility

### Testing the New Architecture

```bash
# Test architecture validation
npm test -- poll-actions.basic.test.ts

# Test simple functionality
npm test -- poll-actions.simple.test.ts

# Run all tests
npm test
```

## Future Improvements

- Complete service layer testing with proper mocks
- Add integration tests with real database
- Add component testing for React components
- Add end-to-end tests with Playwright or Cypress
- Increase test coverage to 90%+
- Add performance testing for critical paths
- Add repository layer tests
- Add validation layer tests
