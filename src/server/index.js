import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';
import net from 'net';
import { logger } from './utils/logger.js';
import crypto from 'crypto';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Port management
const DEFAULT_PORT = 3001;
const MAX_PORT_ATTEMPTS = 10;

const checkPort = (port) => {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', err => {
                if (err.code === 'EADDRINUSE') {
                    logger.warn(`Port ${port} in use, trying next port`);
                    resolve(false);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                tester.once('close', () => resolve(true))
                    .close();
            })
            .listen(port);
    });
};

const findAvailablePort = async (startPort) => {
    for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
        try {
            const available = await checkPort(port);
            if (available) {
                return port;
            }
        } catch (err) {
            logger.error('Error checking port:', err);
        }
    }
    throw new Error('No available ports found');
};

// Express app setup
const app = express();
const httpServer = createServer(app);

// Generate nonce for CSP
app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});

const isDevelopment = process.env.NODE_ENV === 'development';

// Security middleware configuration
if (isDevelopment) {
    // Development mode - minimal security
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false
    }));
} else {
    // Production mode - strict security
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
                fontSrc: ["'self'", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                workerSrc: ["'self'", "blob:"],
                childSrc: ["'self'"],
                frameSrc: ["'self'"]
            }
        }
    }));
}

// Configure CORS
app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: io ? io.engine.clientsCount : 0
    });
});

// Static file serving
app.use(express.static(path.join(__dirname, '../../dist')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// API Routes
app.get('/api/logs', (req, res) => {
    try {
        const logs = {
            error: fs.existsSync(path.join(logsDir, 'error.log')) 
                ? fs.readFileSync(path.join(logsDir, 'error.log'), 'utf8') 
                : '',
            combined: fs.existsSync(path.join(logsDir, 'combined.log'))
                ? fs.readFileSync(path.join(logsDir, 'combined.log'), 'utf8')
                : ''
        };
        res.json(logs);
    } catch (error) {
        logger.error('Failed to retrieve logs:', error);
        res.status(500).json({ error: 'Failed to retrieve logs' });
    }
});

// Socket.IO setup with improved configuration
const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
        origin: true, // Allow all origins in development
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowUpgrades: true,
    perMessageDeflate: false,
    maxHttpBufferSize: 1e8,
    connectTimeout: 45000
});

// Socket.IO event handlers with improved error handling
io.on('connection', (socket) => {
    const startTime = Date.now();
    const clientInfo = {
        socketId: socket.id,
        transport: socket.conn.transport.name,
        address: socket.handshake.address,
        timestamp: new Date().toISOString()
    };
    
    logger.info('Client connected:', clientInfo);

    // Send initial connection acknowledgment
    socket.emit('connection:established', {
        socketId: socket.id,
        timestamp: new Date().toISOString()
    });

    // Handle transport change
    socket.conn.on('upgrade', (transport) => {
        logger.info('Transport upgraded:', {
            socketId: socket.id,
            from: socket.conn.transport.name,
            to: transport.name
        });
    });

    socket.on('error', (error) => {
        logger.error('Socket error:', { socketId: socket.id, error });
        // Notify client of error
        socket.emit('server:error', { message: 'Internal server error' });
    });

    socket.on('disconnect', (reason) => {
        const duration = Date.now() - startTime;
        logger.info('Client disconnected:', { 
            socketId: socket.id,
            reason,
            duration: `${duration}ms`
        });
        // Notify other clients
        socket.broadcast.emit('player:left', { socketId: socket.id });
    });

    // Ping/Pong for latency checks
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });

    // Game events
    socket.on('game:join', (data) => {
        try {
            const playerInfo = {
                socketId: socket.id,
                joinTime: Date.now(),
                ...data
            };
            logger.info('Player joined:', playerInfo);
            
            // Acknowledge join
            socket.emit('game:joined', playerInfo);
            
            // Notify others
            socket.broadcast.emit('player:joined', playerInfo);
        } catch (error) {
            logger.error('Error in game:join:', { socketId: socket.id, error });
            socket.emit('game:error', { message: 'Failed to join game' });
        }
    });

    socket.on('game:update', (data) => {
        try {
            const gameState = {
                timestamp: Date.now(),
                player: socket.id,
                ...data
            };
            socket.broadcast.emit('game:state', gameState);
        } catch (error) {
            logger.error('Error in game:update:', { socketId: socket.id, error });
            socket.emit('game:error', { message: 'Failed to update game state' });
        }
    });
});

// Graceful shutdown handling
const shutdown = (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    // Set a timeout for forceful shutdown
    const forceShutdown = setTimeout(() => {
        logger.error('Forceful shutdown initiated after timeout');
        process.exit(1);
    }, 30000);

    // Close Socket.IO connections
    io.close(() => {
        logger.info('Socket.IO server closed');
        
        // Close HTTP server
        httpServer.close(() => {
            logger.info('HTTP server closed');
            clearTimeout(forceShutdown);
            process.exit(0);
        });
    });
};

// Handle various shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', { reason, promise });
    shutdown('unhandledRejection');
});

// Start server with port management
const startServer = async () => {
    try {
        const port = await findAvailablePort(DEFAULT_PORT);
        
        httpServer.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            
            // Log server configuration
            logger.info('Server configuration:', {
                nodeEnv: process.env.NODE_ENV,
                port,
                corsOrigins: cors.origin,
                socketIOPath: io.path()
            });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();