# App Constants Test Suite

## Overview
This test suite provides comprehensive white-box testing for `app.constants.ts` using Jest testing framework.

## Test Files

### 1. `app.constants.spec.ts`
**Basic Unit Tests** - Tests all constants for:
- Correct values and types
- Positive numeric values
- Non-empty strings
- Valid regex patterns
- Array properties
- Logical relationships between constants

### 2. `app.constants.advanced.spec.ts`
**Advanced White-Box Tests** - Includes:
- Comprehensive regex pattern testing
- Numeric range validation
- String format validation
- Array property testing
- Edge case testing
- Performance testing
- Business logic constraint validation

### 3. `app.constants.integration.spec.ts`
**Integration Tests** - Tests:
- Module import/export functionality
- Immutability of constants
- Integration with NestJS testing framework

### 4. `app.constants.test-utils.ts`
**Test Utilities** - Provides:
- `ConstantsTestUtils` class with helper methods
- Regex pattern testing utilities
- Numeric range validation
- String format validation
- Array property testing
- Comprehensive test runner

## Test Coverage

### Constants Tested:
- ✅ `APP_CONSTANTS` - All sub-objects and properties
- ✅ `ERROR_MESSAGES` - All error message strings
- ✅ `SUCCESS_MESSAGES` - All success message strings
- ✅ `DB_ERROR_CODES` - Database error codes
- ✅ `RECEIVER_TYPES` - Message receiver types
- ✅ `USER_ROLES` - User role definitions
- ✅ `MEMBER_STATUS` - Group member statuses
- ✅ `MESSAGE_TYPES` - Message type definitions
- ✅ `CACHE_KEYS` - Cache key prefixes
- ✅ `REDIS_KEYS` - Redis key prefixes

### Test Categories:

#### 1. **Value Validation Tests**
- Correct numeric values
- Correct string values
- Correct array contents
- Correct regex patterns

#### 2. **Type Safety Tests**
- Proper TypeScript types
- Immutable constants (`as const`)
- Readonly arrays

#### 3. **Business Logic Tests**
- Logical relationships between constants
- Reasonable limits and constraints
- Security best practices

#### 4. **Regex Pattern Tests**
- Phone number validation (`/^\s*(?:\+?\d{1})?[-. (]*\d{3}[-. )]*\d{3}[-. ]*\d{4}\s*$/;`)
- Profile photo URL validation (`/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i`)
- Comprehensive test cases for valid/invalid inputs

#### 5. **Edge Case Tests**
- Empty strings
- Null/undefined values
- Very long strings
- Boundary values

#### 6. **Performance Tests**
- Memory leak prevention
- Regex performance
- Constant access performance

## Running Tests

```bash
# Run all constant tests
npm test --testPathPattern=app.constants

# Run specific test file
npm test --testPathPattern=app.constants.spec.ts

# Run with coverage
npm test --testPathPattern=app.constants --coverage
```

## Test Utilities Usage

```typescript
import { ConstantsTestUtils } from './app.constants.test-utils';

// Test regex patterns
const phoneTest = ConstantsTestUtils.testPhoneRegex();
const photoTest = ConstantsTestUtils.testProfilePhotoRegex();

// Test numeric ranges
const rangeTest = ConstantsTestUtils.testNumericRange(
  value, min, max, fieldName
);

// Test string formats
const formatTest = ConstantsTestUtils.testStringFormat(
  value, fieldName, pattern
);

// Run comprehensive tests
const comprehensiveTest = ConstantsTestUtils.runComprehensiveTests();
```

## White-Box Testing Approach

This test suite uses **white-box testing** methodology by:

1. **Internal Structure Testing**: Testing the internal structure and implementation of constants
2. **Code Coverage**: Ensuring all constants and their properties are tested
3. **Logic Testing**: Testing logical relationships and constraints
4. **Path Testing**: Testing all possible code paths in regex patterns
5. **Boundary Testing**: Testing edge cases and boundary values
6. **Performance Testing**: Testing performance characteristics

## Expected Test Results

All tests should pass with:
- ✅ 100% constant coverage
- ✅ All regex patterns working correctly
- ✅ All numeric values within reasonable ranges
- ✅ All string values properly formatted
- ✅ All arrays with correct properties
- ✅ No performance issues
- ✅ No memory leaks

## Maintenance

When adding new constants:
1. Add corresponding tests in `app.constants.spec.ts`
2. Update test utilities if needed
3. Add edge cases in `app.constants.advanced.spec.ts`
4. Update this README with new test coverage
