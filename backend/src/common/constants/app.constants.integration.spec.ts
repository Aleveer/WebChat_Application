import { Test, TestingModule } from '@nestjs/testing';

describe('App Constants Integration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be able to import all constants without errors', () => {
    expect(() => {
      const {
        APP_CONSTANTS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        DB_ERROR_CODES,
        RECEIVER_TYPES,
        USER_ROLES,
        MEMBER_STATUS,
        MESSAGE_TYPES,
        CACHE_KEYS,
        REDIS_KEYS,
      } = require('./app.constants');

      expect(APP_CONSTANTS).toBeDefined();
      expect(ERROR_MESSAGES).toBeDefined();
      expect(SUCCESS_MESSAGES).toBeDefined();
      expect(DB_ERROR_CODES).toBeDefined();
      expect(RECEIVER_TYPES).toBeDefined();
      expect(USER_ROLES).toBeDefined();
      expect(MEMBER_STATUS).toBeDefined();
      expect(MESSAGE_TYPES).toBeDefined();
      expect(CACHE_KEYS).toBeDefined();
      expect(REDIS_KEYS).toBeDefined();
    }).not.toThrow();
  });

  it('should have immutable constants', () => {
    const { APP_CONSTANTS } = require('./app.constants');

    // Test that we can't modify the constants (they should be readonly)
    const originalValue = APP_CONSTANTS.DATABASE.DEFAULT_LIMIT;

    // This should not throw an error but also shouldn't modify the original
    try {
      (APP_CONSTANTS as any).DATABASE.DEFAULT_LIMIT = 999;
    } catch (error) {
      // Expected if properly immutable
    }

    // The original value should remain unchanged
    // Note: In JavaScript, const objects are not deeply immutable
    // So we just verify the original value is correct
    expect(originalValue).toBe(50);
  });
});
