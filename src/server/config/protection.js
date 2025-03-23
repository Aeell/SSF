import crypto from 'crypto';

export const PROTECTION_CONFIG = {
    // Encryption key for sensitive data
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
    },
    
    // API Protection
    API_PROTECTION: {
        REQUIRE_AUTH: true,
        JWT_SECRET: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
        JWT_EXPIRY: '24h'
    },
    
    // Anti-Cheat Protection
    ANTI_CHEAT: {
        ENABLED: true,
        MAX_SPEED: 20,
        MAX_TELEPORT_DISTANCE: 10,
        MAX_ABILITY_USES_PER_SECOND: 3
    },
    
    // Betting Protection
    BETTING: {
        MIN_BET: 10,
        MAX_BET: 1000,
        MAX_DAILY_BETS: 100,
        COOLDOWN_BETWEEN_BETS: 5000 // 5 seconds
    }
};

// Utility functions for protection
export const ProtectionUtils = {
    encryptData(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(PROTECTION_CONFIG.ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return {
            iv: iv.toString('hex'),
            encrypted,
            authTag: authTag.toString('hex')
        };
    },

    decryptData(encryptedData) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(PROTECTION_CONFIG.ENCRYPTION_KEY),
            Buffer.from(encryptedData.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    },

    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    },

    hashPassword(password) {
        return crypto.pbkdf2Sync(password, PROTECTION_CONFIG.ENCRYPTION_KEY, 10000, 64, 'sha512').toString('hex');
    }
}; 