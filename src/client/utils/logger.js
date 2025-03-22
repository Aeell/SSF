import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Add file transport in development
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
        filename: 'combined.log' 
    }));
}

export default logger; 