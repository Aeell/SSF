export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]>;
  private frameTimes: number[];
  private lastFrameTime: number;
  private fps: number;
  private memoryUsage: number;
  private isMonitoring: boolean;

  private constructor() {
    this.metrics = new Map();
    this.frameTimes = [];
    this.lastFrameTime = performance.now();
    this.fps = 0;
    this.memoryUsage = 0;
    this.isMonitoring = false;
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public start(): void {
    this.isMonitoring = true;
    this.monitorLoop();
  }

  public stop(): void {
    this.isMonitoring = false;
  }

  public recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(value);
  }

  public getMetricAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  public getFPS(): number {
    return this.fps;
  }

  public getMemoryUsage(): number {
    return this.memoryUsage;
  }

  public getMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }

  public clearMetrics(): void {
    this.metrics.clear();
  }

  private monitorLoop(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update FPS
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    this.fps = 1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length);

    // Update memory usage if available
    if (performance.memory) {
      this.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Record frame time
    this.recordMetric('frameTime', deltaTime);

    // Check for performance issues
    this.checkPerformanceIssues();

    // Schedule next frame
    requestAnimationFrame(() => this.monitorLoop());
  }

  private checkPerformanceIssues(): void {
    // Check FPS
    if (this.fps < 30) {
      console.warn(`Low FPS detected: ${this.fps.toFixed(1)}`);
    }

    // Check memory usage
    if (this.memoryUsage > 500) { // 500MB threshold
      console.warn(`High memory usage detected: ${this.memoryUsage.toFixed(1)}MB`);
    }

    // Check frame time spikes
    const recentFrameTimes = this.frameTimes.slice(-10);
    const averageFrameTime = recentFrameTimes.reduce((a, b) => a + b, 0) / recentFrameTimes.length;
    if (averageFrameTime > 33.33) { // More than 30ms per frame
      console.warn(`Frame time spike detected: ${averageFrameTime.toFixed(1)}ms`);
    }
  }

  public generateReport(): string {
    const report: string[] = [];
    report.push('Performance Report');
    report.push('=================');
    report.push(`FPS: ${this.fps.toFixed(1)}`);
    report.push(`Memory Usage: ${this.memoryUsage.toFixed(1)}MB`);
    report.push('\nMetrics:');
    
    this.metrics.forEach((values, name) => {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      report.push(`${name}:`);
      report.push(`  Average: ${average.toFixed(2)}`);
      report.push(`  Min: ${min.toFixed(2)}`);
      report.push(`  Max: ${max.toFixed(2)}`);
    });

    return report.join('\n');
  }

  public exportMetrics(): Record<string, number[]> {
    const exportData: Record<string, number[]> = {};
    this.metrics.forEach((values, name) => {
      exportData[name] = [...values];
    });
    return exportData;
  }
} 