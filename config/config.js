require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    },

    // Database configuration
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_bulk_campaign',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // JWT configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // WhatsApp API configuration
    whatsapp: {
        apiUrl: 'https://graph.facebook.com/v22.0',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '441959912339170',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '480243005165232',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN
    },

    // File upload configuration
    upload: {
        maxSize: process.env.MAX_FILE_SIZE || 5, // in MB
        allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        uploadDir: process.env.UPLOAD_DIR || 'uploads'
    },

    // Credit configuration
    credits: {
        defaultCredits: process.env.DEFAULT_CREDITS || 100,
        minTransferAmount: process.env.MIN_TRANSFER_AMOUNT || 10
    },

    // Rate limiting configuration
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: process.env.RATE_LIMIT_MAX || 100 // limit each IP to 100 requests per windowMs
    },

    // Campaign configuration
    campaign: {
        maxRecipients: process.env.MAX_CAMPAIGN_RECIPIENTS || 1000,
        delayBetweenMessages: process.env.DELAY_BETWEEN_MESSAGES || 1000, // in milliseconds
        maxRetries: process.env.MAX_RETRIES || 3
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
        from: process.env.EMAIL_FROM || 'noreply@whatsapp-bulk.com'
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'app.log'
    },

    // Security configuration
    security: {
        bcryptSaltRounds: 10,
        apiKeyPrefix: 'wa',
        apiKeyLength: 32
    },

    // Cache configuration
    cache: {
        ttl: process.env.CACHE_TTL || 60 * 60, // 1 hour in seconds
        checkPeriod: process.env.CACHE_CHECK_PERIOD || 60 * 60 // 1 hour in seconds
    }
};

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'WHATSAPP_API_URL',
    'WHATSAPP_API_KEY',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

module.exports = config; 