import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    defaultPort: 3000,
    maxPortAttempts: 10,
    serverScript: path.join(__dirname, '../src/server/index.js'),
    portCheckTimeout: 1000, // 1 second timeout for port checks
    forceKillTimeout: 5000  // 5 seconds timeout for force kill
};

// Utility functions
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        const timeout = setTimeout(() => {
            server.close();
            resolve(false);
        }, config.portCheckTimeout);
        
        server.once('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });
        
        server.once('listening', () => {
            clearTimeout(timeout);
            server.close();
            resolve(true);
        });
        
        server.listen(port);
    });
}

async function findProcessOnPort(port) {
    try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const match = stdout.match(/\s+(\d+)$/);
        return match ? parseInt(match[1]) : null;
    } catch (error) {
        return null;
    }
}

async function killProcess(pid) {
    try {
        await execAsync(`taskkill /F /PID ${pid}`);
        console.log(`Killed process ${pid}`);
        return true;
    } catch (error) {
        console.error(`Failed to kill process ${pid}:`, error.message);
        return false;
    }
}

async function cleanupPort(port) {
    const pid = await findProcessOnPort(port);
    if (pid) {
        console.log(`Found process ${pid} using port ${port}`);
        return await killProcess(pid);
    }
    return false;
}

async function findAvailablePort(startPort) {
    for (let port = startPort; port < startPort + config.maxPortAttempts; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
        
        // Try to cleanup the port if it's in use
        console.log(`Port ${port} is in use, attempting cleanup...`);
        const cleaned = await cleanupPort(port);
        
        if (cleaned) {
            // Wait a bit for the port to be fully released
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (await isPortAvailable(port)) {
                return port;
            }
        }
    }
    throw new Error(`No available ports found between ${startPort} and ${startPort + config.maxPortAttempts - 1}`);
}

function startServer(port) {
    const server = spawn('node', [config.serverScript], {
        env: {
            ...process.env,
            PORT: port
        },
        stdio: 'inherit'
    });

    server.on('error', (error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });

    server.on('close', (code) => {
        console.log(`Server exited with code ${code}`);
        process.exit(code);
    });

    return server;
}

// Main process
async function main() {
    try {
        console.log('Starting server...');
        
        // Find available port
        const port = await findAvailablePort(config.defaultPort);
        console.log(`Using port: ${port}`);
        
        // Start server
        const server = startServer(port);
        
        // Handle process termination
        const cleanup = async () => {
            console.log('\nShutting down server...');
            server.kill();
            await cleanupPort(port);
            process.exit(0);
        };
        
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Run main process
main(); 