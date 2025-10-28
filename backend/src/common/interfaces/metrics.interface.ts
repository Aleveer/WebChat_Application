export interface IMetricsService {
  incrementCounter(name: string, value?: number): void;
  decrementCounter(name: string, value?: number): void;
  getCounter(name: string): number;
  getAllCounters(): Record<string, number>;
  
  startTimer(name: string): void;
  endTimer(name: string): number;
  
  recordHistogram(name: string, value: number): void;
  getHistogramStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null;
  getAllHistograms(): Record<string, any>;
  
  reset(): void;
  getSummary(): {
    counters: Record<string, number>;
    histograms: Record<string, any>;
  };
}
