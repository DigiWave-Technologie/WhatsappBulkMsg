const axios = require('axios');

async function testLogin() {
    try {
        // First, create a super admin user
        console.log('Creating super admin user...');
        const createResponse = await axios.post('http://localhost:5000/api/auth/createUser', {
            username: 'superadmin',
            password: 'admin123',
            role: 'super_admin',
            email: 'superadmin@example.com',
            firstName: 'Super',
            lastName: 'Admin'
        });
        console.log('Create user response:', createResponse.data);

        // Then, test the login
        console.log('\nTesting login...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'superadmin',
            password: 'admin123'
        });
        console.log('Login response:', loginResponse.data);

        // If login successful, test a protected route
        if (loginResponse.data.success) {
            console.log('\nTesting protected route...');
            const usersResponse = await axios.get('http://localhost:5000/api/users', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.data.token}`
                }
            });
            console.log('Protected route response:', usersResponse.data);
        }
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testLogin(); 