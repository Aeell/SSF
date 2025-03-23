import { logger } from './logger.js';

export function exportAllLogs() {
    try {
        const logs = logger.getLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logger.debug('Logs exported successfully');
    } catch (error) {
        logger.error('Failed to export logs:', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
} 