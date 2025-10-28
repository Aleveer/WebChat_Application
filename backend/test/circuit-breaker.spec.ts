import { CircuitBreaker, CircuitState } from '../src/common/utils/circuit-breaker';
import { Logger } from '@nestjs/common';

/**
 * White-box Testing for CircuitBreaker
 * 
 * This test suite uses white-box testing techniques to ensure complete code coverage
 * including all branches, paths, and edge cases.
 * 
 * Coverage areas:
 * 1. State transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 * 2. Failure threshold logic
 * 3. Success threshold logic
 * 4. Timeout and monitoring period
 * 5. Edge cases and boundary conditions
 */
describe('CircuitBreaker - White Box Testing', () => {
  let circuitBreaker: CircuitBreaker;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock logger to prevent console output during tests
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default config when no config provided', () => {
      circuitBreaker = new CircuitBreaker('test-service');
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.nextAttempt).toBeNull();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker initialized for test-service')
      );
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        failureThreshold: 3,
        successThreshold: 1,
        timeout: 30000,
        monitoringPeriod: 60000,
      };
      
      circuitBreaker = new CircuitBreaker('custom-service', customConfig);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(customConfig))
      );
    });
  });

  describe('State: CLOSED - Normal Operation', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 5000,
        monitoringPeriod: 10000,
      });
    });

    it('should execute function successfully and remain CLOSED', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failureCount).toBe(0);
    });

    it('should count failures but remain CLOSED when below threshold', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));
      
      // First failure
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failureCount).toBe(1);
      
      // Second failure
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failureCount).toBe(2);
    });

    it('should transition to OPEN when failure threshold is reached', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));
      
      // Reach threshold (3 failures)
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Service error');
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getStats().failureCount).toBe(3);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OPENED (threshold 3 reached)')
      );
    });

    it('should reset failure count on success after failures', async () => {
      const mockFailFn = jest.fn().mockRejectedValue(new Error('Error'));
      const mockSuccessFn = jest.fn().mockResolvedValue('success');
      
      // 2 failures
      await expect(circuitBreaker.execute(mockFailFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFailFn)).rejects.toThrow();
      expect(circuitBreaker.getStats().failureCount).toBe(2);
      
      // 1 success - should reset count
      await circuitBreaker.execute(mockSuccessFn);
      expect(circuitBreaker.getStats().failureCount).toBe(0);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('State: OPEN - Rejecting Requests', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
    });

    it('should reject requests immediately when OPEN', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Next request should be rejected without calling mockFn
      mockFn.mockClear();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(
        'Circuit breaker is OPEN for test-service'
      );
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should throw CircuitBreakerOpenError with correct error name', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }
      
      // Check error details
      try {
        await circuitBreaker.execute(mockFn);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.name).toBe('CircuitBreakerOpenError');
        expect(error.message).toContain('Circuit breaker is OPEN');
      }
    });

    it('should transition to HALF_OPEN after timeout expires', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Advance time past timeout
      jest.advanceTimersByTime(1100);
      
      // Next request should transition to HALF_OPEN
      mockFn.mockResolvedValueOnce('success');
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      jest.useRealTimers();
    });

    it('should remain OPEN if timeout has not expired', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Advance time but not enough
      jest.advanceTimersByTime(500); // Half of timeout
      
      // Should still reject
      mockFn.mockClear();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(
        'Circuit breaker is OPEN'
      );
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('State: HALF_OPEN - Testing Recovery', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 100,
        monitoringPeriod: 5000,
      });
    });

    it('should transition to CLOSED after reaching success threshold', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // Open the circuit
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for timeout and transition to HALF_OPEN
      jest.advanceTimersByTime(150);
      mockFn.mockResolvedValue('success');
      
      // First success in HALF_OPEN
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(circuitBreaker.getStats().successCount).toBe(1);
      
      // Second success - should close
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().successCount).toBe(0);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLOSED (service recovered)')
      );
      
      jest.useRealTimers();
    });

    it('should return to OPEN on failure during HALF_OPEN', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // Open the circuit
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Transition to HALF_OPEN
      jest.advanceTimersByTime(150);
      mockFn.mockResolvedValueOnce('success');
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      // Fail during HALF_OPEN - should return to OPEN
      mockFn.mockRejectedValueOnce(new Error('Still failing'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Still failing');
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getStats().successCount).toBe(0);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OPENED (failed during half-open test)')
      );
      
      jest.useRealTimers();
    });

    it('should count successes correctly in HALF_OPEN state', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // Open the circuit
      mockFn.mockRejectedValue(new Error('Error'));
      for (let i = 0; i < 2; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }
      
      // Move to HALF_OPEN
      jest.advanceTimersByTime(150);
      mockFn.mockResolvedValue('success');
      
      // First success
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getStats().successCount).toBe(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      
      jest.useRealTimers();
    });
  });

  describe('Monitoring Period and Reset Logic', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 2000,
      });
    });

    it('should reset failure count after monitoring period expires', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // Generate 2 failures
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getStats().failureCount).toBe(2);
      
      // Advance past monitoring period
      jest.advanceTimersByTime(2500);
      
      // Next call should trigger reset check
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getStats().failureCount).toBe(0);
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('reset failure count (monitoring period expired)')
      );
      
      jest.useRealTimers();
    });

    it('should not reset if monitoring period has not expired', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // Generate failures
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Advance time but not enough
      jest.advanceTimersByTime(1000);
      
      // Check that count is not reset
      expect(circuitBreaker.getStats().failureCount).toBe(2);
      
      jest.useRealTimers();
    });

    it('should not reset when state is not CLOSED', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Advance past monitoring period
      jest.advanceTimersByTime(3000);
      
      // Failure count should remain
      expect(circuitBreaker.getStats().failureCount).toBe(3);
      
      jest.useRealTimers();
    });
  });

  describe('Execute with Fallback', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
    });

    it('should return primary function result on success', async () => {
      const primaryFn = jest.fn().mockResolvedValue('primary result');
      const fallbackFn = jest.fn().mockResolvedValue('fallback result');
      
      const result = await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      
      expect(result).toBe('primary result');
      expect(primaryFn).toHaveBeenCalled();
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('should execute fallback function on primary failure', async () => {
      const primaryFn = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallbackFn = jest.fn().mockResolvedValue('fallback result');
      
      const result = await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      
      expect(result).toBe('fallback result');
      expect(primaryFn).toHaveBeenCalled();
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('should execute fallback when circuit is OPEN', async () => {
      const primaryFn = jest.fn().mockRejectedValue(new Error('Error'));
      const fallbackFn = jest.fn().mockResolvedValue('fallback');
      
      // Open the circuit
      await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Should use fallback without calling primary
      primaryFn.mockClear();
      const result = await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      
      expect(result).toBe('fallback');
      expect(primaryFn).not.toHaveBeenCalled();
    });

    it('should handle fallback as direct value (non-function)', async () => {
      const primaryFn = jest.fn().mockRejectedValue(new Error('Error'));
      const fallbackValue = 'static fallback';
      
      const result = await circuitBreaker.executeWithFallback(
        primaryFn,
        () => fallbackValue
      );
      
      expect(result).toBe('static fallback');
    });

    it('should log warning when using fallback', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const primaryFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const fallbackFn = jest.fn().mockResolvedValue('fallback');
      
      await circuitBreaker.executeWithFallback(primaryFn, fallbackFn);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('executing fallback due to: Test error')
      );
    });
  });

  describe('Manual Controls and Statistics', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 5000,
        monitoringPeriod: 10000,
      });
    });

    it('should manually reset circuit breaker', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Generate failures
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getStats().failureCount).toBe(2);
      
      // Reset manually
      circuitBreaker.reset();
      
      const stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('manually reset')
      );
    });

    it('should manually force circuit open', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      circuitBreaker.forceOpen();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getStats().nextAttempt).not.toBeNull();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('manually opened')
      );
    });

    it('should return correct statistics', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      const stats = circuitBreaker.getStats();
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('failureCount');
      expect(stats).toHaveProperty('successCount');
      expect(stats).toHaveProperty('nextAttempt');
      expect(stats.failureCount).toBe(1);
    });

    it('should return null nextAttempt when not OPEN', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().nextAttempt).toBeNull();
    });

    it('should return timestamp for nextAttempt when OPEN', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.nextAttempt).toBeGreaterThan(Date.now());
    });

    it('should provide getState() method', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle failureThreshold of 1', async () => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Single failure should open circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should handle successThreshold of 1', async () => {
      jest.useFakeTimers();
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 100,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn();
      
      // Open circuit
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Move to HALF_OPEN and recover with single success
      jest.advanceTimersByTime(150);
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      jest.useRealTimers();
    });

    it('should handle very small timeout values', async () => {
      jest.useFakeTimers();
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 1, // 1ms
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn();
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Advance minimal time
      jest.advanceTimersByTime(2);
      mockFn.mockResolvedValue('success');
      
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      
      jest.useRealTimers();
    });

    it('should handle concurrent execute calls', async () => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn().mockResolvedValue('success');
      
      // Execute multiple calls concurrently
      const promises = Array(10).fill(null).map(() => 
        circuitBreaker.execute(mockFn)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(results.every(r => r === 'success')).toBe(true);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should handle errors without message property', async () => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn().mockRejectedValue('string error');
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toBe('string error');
      expect(circuitBreaker.getStats().failureCount).toBe(1);
    });

    it('should handle zero monitoring period edge case', async () => {
      jest.useFakeTimers();
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 0,
      });
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      expect(circuitBreaker.getStats().failureCount).toBe(1);
      
      // Should reset immediately
      jest.advanceTimersByTime(1);
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getStats().failureCount).toBe(0);
      
      jest.useRealTimers();
    });
  });

  describe('Error Logging and Monitoring', () => {
    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 5000,
        monitoringPeriod: 10000,
      });
    });

    it('should log each failure with details', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error');
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('recorded failure 1/3: Test error')
      );
    });

    it('should log state transitions', async () => {
      jest.useFakeTimers();
      const mockFn = jest.fn();
      
      // CLOSED -> OPEN
      mockFn.mockRejectedValue(new Error('Error'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      }
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('OPENED')
      );
      
      // OPEN -> HALF_OPEN
      jest.advanceTimersByTime(6000);
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('entering HALF_OPEN state')
      );
      
      // HALF_OPEN -> CLOSED
      await circuitBreaker.execute(mockFn);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLOSED (service recovered)')
      );
      
      jest.useRealTimers();
    });
  });

  describe('Path Coverage - Complete Branch Testing', () => {
    /**
     * This section ensures all code paths are tested
     * Testing all if/else branches and logical conditions
     */
    
    it('should cover checkMonitoringPeriod when state is CLOSED and lastFailureTime > 0', async () => {
      jest.useFakeTimers();
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 2000,
      });
      
      const mockFn = jest.fn();
      
      // Create a failure to set lastFailureTime
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Advance past monitoring period
      jest.advanceTimersByTime(2500);
      
      // This should trigger the reset logic
      mockFn.mockResolvedValue('success');
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getStats().failureCount).toBe(0);
      
      jest.useRealTimers();
    });

    it('should cover onSuccess when state is HALF_OPEN but below successThreshold', async () => {
      jest.useFakeTimers();
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 1,
        successThreshold: 3, // Need 3 successes
        timeout: 100,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn();
      
      // Open circuit
      mockFn.mockRejectedValue(new Error('Error'));
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      // Move to HALF_OPEN
      jest.advanceTimersByTime(150);
      mockFn.mockResolvedValue('success');
      
      // First success - should stay HALF_OPEN
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(circuitBreaker.getStats().successCount).toBe(1);
      
      // Second success - still HALF_OPEN
      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(circuitBreaker.getStats().successCount).toBe(2);
      
      jest.useRealTimers();
    });

    it('should cover onFailure when state is CLOSED and below threshold', async () => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 10,
        successThreshold: 2,
        timeout: 1000,
        monitoringPeriod: 5000,
      });
      
      const mockFn = jest.fn().mockRejectedValue(new Error('Error'));
      
      // Fail but stay closed
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failureCount).toBe(1);
    });
  });
});
