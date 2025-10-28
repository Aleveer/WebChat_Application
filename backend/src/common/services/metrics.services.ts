import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface MetricsCounter {
  [key: string]: number;
}

export interface MetricsHistogram {
  [key: string]: number[];
}

// Circular Buffer for efficient memory management
class CircularBuffer {
  private buffer: number[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(value: number): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  toArray(): number[] {
    if (this.size === 0) return [];

    const result: number[] = [];
    const start = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[(start + i) % this.capacity]);
    }

    return result;
  }

  getSize(): number {
    return this.size;
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
  }
}

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters: MetricsCounter = {};

  // Use CircularBuffer instead of array for better memory management
  private readonly histograms: Map<string, CircularBuffer> = new Map();
  private readonly timers: Map<string, number> = new Map();
  private timerIdCounter = 0;

  // Configuration for memory limits
  private readonly MAX_HISTOGRAM_SIZE = 1000;
  private readonly MAX_HISTOGRAMS = 100;
  private readonly MAX_TIMERS = 10000;

  // Cleanup interval
  private cleanupInterval: NodeJS.Timeout;

  onModuleInit() {
    this.logger.log('Metrics service initialized with memory management');

    // Setup periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldTimers();
      },
      5 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.logger.log('Metrics service destroyed');
  }

  private cleanupOldTimers(): void {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes
    let cleaned = 0;

    for (const [key, startTime] of this.timers.entries()) {
      if (now - startTime > timeout) {
        this.timers.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.warn(`Cleaned up ${cleaned} stale timers`);
    }

    if (this.timers.size > this.MAX_TIMERS) {
      const excess = this.timers.size - this.MAX_TIMERS;
      const keys = Array.from(this.timers.keys()).slice(0, excess);
      keys.forEach((key) => this.timers.delete(key));
      this.logger.warn(`Removed ${excess} timers to enforce memory limit`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  dailyCleanup(): void {
    this.logger.log('Running daily metrics cleanup');

    // Keep only essential counters, reset others
    const essentialCounters = ['http_requests_total', 'http_errors_total'];
    for (const key of Object.keys(this.counters)) {
      if (!essentialCounters.includes(key)) {
        delete this.counters[key];
      }
    }

    this.logger.log('Daily cleanup completed');
  }

  // Increment a counter
  incrementCounter(name: string, value: number = 1): void {
    this.counters[name] = (this.counters[name] || 0) + value;
  }

  // Decrement a counter
  decrementCounter(name: string, value: number = 1): void {
    this.counters[name] = Math.max(0, (this.counters[name] || 0) - value);
  }

  // Start a timer with unique ID to prevent race conditions
  startTimer(name: string, requestId?: string): string {
    // Generate unique timer key using name + requestId (or auto-increment ID)
    const uniqueId = requestId || `${name}_${++this.timerIdCounter}`;
    const timerKey = `${name}:${uniqueId}`;

    this.timers.set(timerKey, Date.now());
    return timerKey;
  }

  // End a timer using the unique timer key returned from startTimer
  endTimer(timerKey: string): number {
    const startTime = this.timers.get(timerKey);
    if (!startTime) {
      this.logger.warn(`Timer ${timerKey} was not started or already ended`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(timerKey);

    // Extract metric name from timer key (before the colon)
    const metricName = timerKey.split(':')[0];

    // Use CircularBuffer
    this.recordHistogram(metricName, duration);

    return duration;
  }

  // Record a value in histogram
  recordHistogram(name: string, value: number): void {
    //Enforce max histograms limit
    if (
      !this.histograms.has(name) &&
      this.histograms.size >= this.MAX_HISTOGRAMS
    ) {
      this.logger.warn(
        `Max histograms limit (${this.MAX_HISTOGRAMS}) reached. Skipping: ${name}`,
      );
      return;
    }

    //Use CircularBuffer for automatic memory management
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new CircularBuffer(this.MAX_HISTOGRAM_SIZE));
    }

    this.histograms.get(name)!.push(value);
  }

  // Get counter value
  getCounter(name: string): number {
    return this.counters[name] || 0;
  }

  // Get all counters
  getAllCounters(): MetricsCounter {
    return { ...this.counters };
  }

  // Get histogram statistics
  getHistogramStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const buffer = this.histograms.get(name);
    if (!buffer || buffer.getSize() === 0) {
      return null;
    }

    const values = buffer.toArray();
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const avg = sum / count;
    const p50 = sorted[Math.floor(count * 0.5)] || 0;
    const p95 = sorted[Math.floor(count * 0.95)] || 0;
    const p99 = sorted[Math.floor(count * 0.99)] || 0;

    return { count, min, max, avg, p50, p95, p99 };
  }

  // Get all histograms
  getAllHistograms(): Record<
    string,
    {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    } | null
  > {
    const result: Record<
      string,
      {
        count: number;
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
      } | null
    > = {};

    for (const name of this.histograms.keys()) {
      const stats = this.getHistogramStats(name);
      if (stats) {
        result[name] = stats;
      }
    }

    return result;
  }

  // Reset all metrics
  reset(): void {
    Object.keys(this.counters).forEach((key) => {
      delete this.counters[key];
    });
    this.histograms.clear();
    this.timers.clear();
    this.logger.log('All metrics reset');
  }

  // Get summary
  getSummary(): {
    counters: MetricsCounter;
    histograms: Record<
      string,
      {
        count: number;
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
      } | null
    >;
  } {
    return {
      counters: this.getAllCounters(),
      histograms: this.getAllHistograms(),
    };
  }
}
