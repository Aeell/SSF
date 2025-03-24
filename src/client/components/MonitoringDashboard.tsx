import React, { useEffect, useState } from 'react';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { ErrorTracker } from '../utils/ErrorTracker';
import { Logger, LogLevel } from '../utils/logger';

interface DashboardState {
  fps: number;
  memoryUsage: number;
  errorCount: number;
  recentLogs: any[];
  performanceMetrics: Record<string, number[]>;
}

export const MonitoringDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    fps: 0,
    memoryUsage: 0,
    errorCount: 0,
    recentLogs: [],
    performanceMetrics: {},
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    const errorTracker = ErrorTracker.getInstance();
    const logger = Logger.getInstance();

    const updateDashboard = () => {
      setState({
        fps: performanceMonitor.getFPS(),
        memoryUsage: performanceMonitor.getMemoryUsage(),
        errorCount: errorTracker.getErrorCount(),
        recentLogs: logger.getLogs().slice(-5),
        performanceMetrics: performanceMonitor.exportMetrics(),
      });
    };

    const interval = setInterval(updateDashboard, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '8px 16px',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        Show Debug Panel
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '400px',
        height: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflow: 'auto',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Performance</h4>
        <div>FPS: {state.fps.toFixed(1)}</div>
        <div>Memory: {state.memoryUsage.toFixed(1)}MB</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Errors</h4>
        <div>Total Errors: {state.errorCount}</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Recent Logs</h4>
        {state.recentLogs.map((log, index) => (
          <div
            key={index}
            style={{
              color: log.level === LogLevel.ERROR ? '#ff4444' :
                     log.level === LogLevel.WARN ? '#ffbb33' :
                     log.level === LogLevel.INFO ? '#00C851' : '#33b5e5',
              marginBottom: '4px',
            }}
          >
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.level}: {log.message}
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ margin: '0 0 8px 0' }}>Performance Metrics</h4>
        {Object.entries(state.performanceMetrics).map(([name, values]) => {
          const numericValues = values as number[];
          const average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          return (
            <div key={name} style={{ marginBottom: '4px' }}>
              {name}: {average.toFixed(2)}ms
            </div>
          );
        })}
      </div>
    </div>
  );
};