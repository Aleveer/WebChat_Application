import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

export interface MetricsCounter {
  [key: string]: number;
}

export interface MetricsHistogram {
  [key: string]: number[];
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters: MetricsCounter = {};
  private readonly histograms: MetricsHistogram = {};
  // FIXED: Use Map with compound keys to avoid race conditions
  private readonly timers: Map<string, number> = new Map();
  private timerIdCounter = 0;

  onModuleInit() {
    this.logger.log('Metrics service initialized');
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

    if (!this.histograms[metricName]) {
      this.histograms[metricName] = [];
    }

    // FIXED: Check size BEFORE pushing to prevent memory spikes
    if (this.histograms[metricName].length >= 1000) {
      // Remove oldest 10% to reduce frequency of array operations
      this.histograms[metricName] = this.histograms[metricName].slice(-900);
    }

    this.histograms[metricName].push(duration);

    return duration;
  }

  // Record a value in histogram
  recordHistogram(name: string, value: number): void {
    if (!this.histograms[name]) {
      this.histograms[name] = [];
    }

    // FIXED: Check size BEFORE pushing to prevent memory spikes
    if (this.histograms[name].length >= 1000) {
      // Remove oldest 10% to reduce frequency of array operations
      this.histograms[name] = this.histograms[name].slice(-900);
    }

    this.histograms[name].push(value);
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
    const values = this.histograms[name];
    if (!values || values.length === 0) {
      return null;
    }

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
    for (const name of Object.keys(this.histograms)) {
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
    Object.keys(this.histograms).forEach((key) => {
      delete this.histograms[key];
    });
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
