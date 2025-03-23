import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
    directories: ['src/client', 'src/server'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    ignorePatterns: ['node_modules', 'dist', 'build', '.git', 'coverage']
};

// Utility functions
function isIgnored(filePath) {
    return config.ignorePatterns.some(pattern => filePath.includes(pattern));
}

function getFileExtension(filePath) {
    return path.extname(filePath);
}

function isTargetFile(filePath) {
    return config.extensions.includes(getFileExtension(filePath));
}

async function formatCode(filePath) {
    try {
        await execAsync(`npx prettier --write "${filePath}"`);
        console.log(`Formatted: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error formatting ${filePath}:`, error.message);
        return false;
    }
}

async function removeConsoleStatements(content) {
    return content.replace(/console\.(log|debug|info|warn|error|trace)\([^)]*\);?/g, '');
}

async function removeEmptyLines(content) {
    return content.split('\n')
        .filter(line => line.trim() !== '')
        .join('\n');
}

async function processFile(filePath) {
    try {
        let content = await fs.promises.readFile(filePath, 'utf8');
        
        // Remove console statements
        content = await removeConsoleStatements(content);
        
        // Remove empty lines
        content = await removeEmptyLines(content);
        
        // Write back to file
        await fs.promises.writeFile(filePath, content, 'utf8');
        
        // Format with prettier
        await formatCode(filePath);
        
        return true;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

async function processDirectory(dirPath) {
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (isIgnored(fullPath)) continue;
            
            if (entry.isDirectory()) {
                await processDirectory(fullPath);
            } else if (entry.isFile() && isTargetFile(fullPath)) {
                await processFile(fullPath);
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Directory not found: ${dirPath}`);
        } else {
            console.error(`Error processing directory ${dirPath}:`, error.message);
        }
    }
}

async function cleanCodebase() {
    console.log('Starting codebase cleanup...');
    
    for (const dir of config.directories) {
        const fullPath = path.join(process.cwd(), dir);
        console.log(`Processing directory: ${dir}`);
        await processDirectory(fullPath);
    }
    
    console.log('Codebase cleanup completed.');
}

// Run the cleanup
cleanCodebase().catch(error => {
    console.error('Failed to clean codebase:', error);
    process.exit(1);
}); 