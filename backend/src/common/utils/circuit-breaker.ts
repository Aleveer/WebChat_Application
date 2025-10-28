import { Injectable, Logger } from '@nestjs/common';

/**
 * Circuit Breaker States
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes to close circuit from half-open
  timeout: number; // Timeout in ms before trying half-open
  monitoringPeriod: number; // Time window to count failures (ms)
}

/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by stopping requests to failing services
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, reject all requests immediately
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreaker('email-service', {
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000,
 *   monitoringPeriod: 120000
 * });
 *
 * try {
 *   const result = await breaker.execute(() => sendEmail(...));
 * } catch (error) {
 *   // Handle failure or circuit open
 * }
 * ```
 */
@Injectable()
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);

  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime: number = 0;

  constructor(
    private readonly serviceName: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      monitoringPeriod: 120000, // 2 minutes
    },
  ) {
    this.logger.log(
      `Circuit breaker initialized for ${serviceName} with config: ${JSON.stringify(config)}`,
    );
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should reset (monitoring period expired)
    this.checkMonitoringPeriod();

    // If circuit is open, reject immediately
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        const error = new Error(
          `Circuit breaker is OPEN for ${this.serviceName}. Service unavailable.`,
        );
        error.name = 'CircuitBreakerOpenError';
        throw error;
      }

      // Timeout expired, move to half-open to test
      this.state = CircuitState.HALF_OPEN;
      this.logger.log(
        `Circuit breaker for ${this.serviceName} entering HALF_OPEN state`,
      );
    }

    try {
      // Execute the function
      const result = await fn();

      // Success - handle based on current state
      this.onSuccess();

      return result;
    } catch (error) {
      // Failure - handle based on current state
      this.onFailure(error);

      throw error;
    }
  }

  /**
   * Execute with fallback function
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: () => Promise<T> | T,
  ): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      this.logger.warn(
        `Circuit breaker for ${this.serviceName} executing fallback due to: ${error.message}`,
      );

      return typeof fallback === 'function' ? await fallback() : fallback;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.logger.log(
          `Circuit breaker for ${this.serviceName} CLOSED (service recovered)`,
        );
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    this.logger.error(
      `Circuit breaker for ${this.serviceName} recorded failure ${this.failureCount}/${this.config.failureThreshold}: ${error.message}`,
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during half-open, go back to open
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.nextAttempt = Date.now() + this.config.timeout;

      this.logger.warn(
        `Circuit breaker for ${this.serviceName} OPENED (failed during half-open test)`,
      );
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Threshold reached, open the circuit
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.timeout;

      this.logger.warn(
        `Circuit breaker for ${this.serviceName} OPENED (threshold ${this.config.failureThreshold} reached)`,
      );
    }
  }

  /**
   * Check if monitoring period expired and reset if needed
   */
  private checkMonitoringPeriod(): void {
    if (
      this.state === CircuitState.CLOSED &&
      this.lastFailureTime > 0 &&
      Date.now() - this.lastFailureTime > this.config.monitoringPeriod
    ) {
      this.failureCount = 0;
      this.lastFailureTime = 0;

      this.logger.debug(
        `Circuit breaker for ${this.serviceName} reset failure count (monitoring period expired)`,
      );
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttempt: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN ? this.nextAttempt : null,
    };
  }

  /**
   * Manually reset the circuit breaker (for testing/admin)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = 0;

    this.logger.log(`Circuit breaker for ${this.serviceName} manually reset`);
  }

  /**
   * Force open the circuit (for maintenance/testing)
   */
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.config.timeout;

    this.logger.warn(`Circuit breaker for ${this.serviceName} manually opened`);
  }
}
