import logger from './logger';

export function exportAllLogs() {
    const logs = {
        client: {
            logs: logger.getLogs(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        },
        errors: {
            console: logger.getLogs().filter(log => log.level === 'error'),
            network: logger.getLogs().filter(log => 
                log.message.includes('[NetworkManager]') && 
                log.level === 'error'
            ),
            game: logger.getLogs().filter(log => 
                log.message.includes('[Game]') && 
                log.level === 'error'
            )
        },
        stats: {
            totalLogs: logger.getLogs().length,
            errorCount: logger.getLogs().filter(log => log.level === 'error').length,
            warningCount: logger.getLogs().filter(log => log.level === 'warn').length,
            startTime: logger.getLogs()[0]?.timestamp,
            lastLog: logger.getLogs().slice(-1)[0]?.timestamp
        }
    };

    // Create a downloadable file
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return logs;
} 