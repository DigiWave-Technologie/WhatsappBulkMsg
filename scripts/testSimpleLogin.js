const axios = require('axios');

const testSimpleLogin = async () => {
  try {
    console.log('Testing login API with simple super admin credentials...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin@123'
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Save token for future use
    const token = response.data.data.token;
    console.log('\nToken:', token);
    
    return token;
  } catch (error) {
    console.error('Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
};

testSimpleLogin(); 