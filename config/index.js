require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-bulk-campaign',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    whatsapp: {
        apiUrl: 'https://mock-whatsapp-api.example.com',
        apiKey: 'mock-api-key',
        phoneNumberId: 'mock-phone-number-id',
        businessAccountId: 'mock-business-account-id'
    },
    environment: process.env.NODE_ENV || 'development'
}; 