require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT,
        env: process.env.NODE_ENV,
        baseUrl: process.env.BASE_URL
    },

    // Database configuration
    database: {
        uri: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN
    },

    // WhatsApp API configuration
    whatsapp: {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v22.0'
    },

    // File upload configuration
    upload: {
        maxSize: process.env.MAX_FILE_SIZE, // in MB
        allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        uploadDir: process.env.UPLOAD_DIR
    },

    // Credit configuration
    credits: {
        defaultCredits: process.env.DEFAULT_CREDITS,
        minTransferAmount: process.env.MIN_TRANSFER_AMOUNT
    },

    // Rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.RATE_LIMIT_MAX
    },

    // Campaign configuration
    campaign: {
        maxRecipients: process.env.MAX_CAMPAIGN_RECIPIENTS,
        delayBetweenMessages: process.env.DELAY_BETWEEN_MESSAGES,
        maxRetries: process.env.MAX_RETRIES
    },

    // Email configuration
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL,
        file: process.env.LOG_FILE
    },

    // Security configuration
    security: {
        bcryptSaltRounds: 10,
        apiKeyPrefix: 'wa',
        apiKeyLength: 32
    },

    // Cache configuration
    cache: {
        ttl: process.env.CACHE_TTL,
        checkPeriod: process.env.CACHE_CHECK_PERIOD
    }
};

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'WHATSAPP_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

module.exports = config;