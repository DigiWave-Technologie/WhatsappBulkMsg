const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function loginAndTestPermissions() {
  try {
    // Step 1: Login as Super Admin
    console.log('🔐 Logging in as Super Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'superadmin1',
      password: 'SuperAdmin@123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful!');
    console.log(`🔑 Token: ${token.substring(0, 30)}...`);

    // Step 2: Get all users
    console.log('\n🔍 Getting all users...');
    const usersResponse = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.data.success) {
      console.log('❌ Failed to get users:', usersResponse.data.message);
      return;
    }

    const users = usersResponse.data.data;
    console.log(`✅ Retrieved ${users.length} users successfully\n`);
    
    // Focus on test users with their permissions
    const testUsers = ['superadmin1', 'admin1', 'reseller1', 'user1', 'user2'];
    
    console.log('🎯 UI PERMISSIONS ANALYSIS:');
    console.log('============================');
    
    testUsers.forEach(username => {
      const user = users.find(u => u.username === username);
      if (user && user.permissions) {
        console.log(`\n👤 ${user.username} (${user.role}):`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log(`   🎯 Campaign Type Permissions:`);
        console.log(`      🔷 Virtual: ${user.permissions.virtual ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`      📱 Personal: ${user.permissions.personal ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`      🌍 International Personal: ${user.permissions.internationalPersonal ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`      🌐 International Virtual: ${user.permissions.internationalVirtual ? '✅ ENABLED' : '❌ DISABLED'}`);
        
        // Show enabled permissions summary
        const enabled = Object.entries(user.permissions)
          .filter(([key, value]) => value === true)
          .map(([key]) => key);
        console.log(`   📊 Summary: ${enabled.length > 0 ? enabled.join(', ') : 'No permissions enabled'}`);
        
        // Show creator info
        if (user.creator) {
          console.log(`   👥 Created by: ${user.creator.username}`);
        } else {
          console.log(`   👥 Created by: System/Self-created`);
        }
      } else if (user) {
        console.log(`\n👤 ${user.username} (${user.role}): No permissions object found`);
      } else {
        console.log(`\n❌ User ${username} not found`);
      }
    });
    
    // Permission matrix
    console.log('\n📋 PERMISSION MATRIX:');
    console.log('======================');
    console.log('User          | Virtual | Personal | Intl Personal | Intl Virtual');
    console.log('------------- | ------- | -------- | ------------- | ------------');
    
    testUsers.forEach(username => {
      const user = users.find(u => u.username === username);
      if (user && user.permissions) {
        const p = user.permissions;
        const row = `${username.padEnd(13)} | ${(p.virtual ? '   ✅   ' : '   ❌   ')} | ${(p.personal ? '   ✅    ' : '   ❌    ')} | ${(p.internationalPersonal ? '      ✅      ' : '      ❌      ')} | ${(p.internationalVirtual ? '     ✅     ' : '     ❌     ')}`;
        console.log(row);
      }
    });
    
    console.log('\n🎯 POSTMAN TESTING INFORMATION:');
    console.log('================================');
    console.log(`🔑 Fresh Super Admin Token: ${token}`);
    console.log('\n📝 Test these endpoints in Postman:');
    console.log('1. GET /api/auth/users (with super admin token)');
    console.log('2. Check the "permissions" object in each user');
    console.log('3. Verify the 4 boolean fields: virtual, personal, internationalPersonal, internationalVirtual');
    
    console.log('\n✅ Permission testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

loginAndTestPermissions();
