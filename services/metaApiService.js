const axios = require('axios');
class MetaApiService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v22.0';
    this.accessToken = process.env.META_ACCESS_TOKEN;
  }

  async sendMessage(phoneNumber, message) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/<PHONE_NUMBER_ID>/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Meta API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new MetaApiService();