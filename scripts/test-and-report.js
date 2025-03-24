const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run tests with coverage
console.log('Running tests with coverage...');
execSync('npm test -- --coverage', { stdio: 'inherit' });

// Generate test report
const coverageReport = fs.readFileSync(path.join(__dirname, '../coverage/lcov-report/index.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../reports/test-report.html'), coverageReport);

// Generate performance report
const performanceMonitor = require('../src/client/utils/PerformanceMonitor').getInstance();
const performanceReport = performanceMonitor.generateReport();
fs.writeFileSync(path.join(__dirname, '../reports/performance-report.txt'), performanceReport);

// Generate error report
const errorTracker = require('../src/client/utils/ErrorTracker').getInstance();
const errorReport = errorTracker.generateReport();
fs.writeFileSync(path.join(__dirname, '../reports/error-report.txt'), errorReport);

// Generate log report
const logger = require('../src/client/utils/logger').getInstance();
const logReport = logger.generateReport();
fs.writeFileSync(path.join(__dirname, '../reports/log-report.txt'), logReport);

// Generate combined report
const combinedReport = `
SUPER SLAM FOOTBALL - TEST AND MONITORING REPORT
==============================================

${fs.readFileSync(path.join(__dirname, '../reports/test-report.txt'), 'utf8')}

${fs.readFileSync(path.join(__dirname, '../reports/performance-report.txt'), 'utf8')}

${fs.readFileSync(path.join(__dirname, '../reports/error-report.txt'), 'utf8')}

${fs.readFileSync(path.join(__dirname, '../reports/log-report.txt'), 'utf8')}
`;

fs.writeFileSync(path.join(__dirname, '../reports/combined-report.txt'), combinedReport);

console.log('Reports generated successfully!'); 