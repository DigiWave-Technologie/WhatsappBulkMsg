const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const SUPER_ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODRlMzIyZTQwOGQ2MmViZTI0ODAxZDUiLCJ1c2VybmFtZSI6InN1cGVyYWRtaW4xIiwicm9sZSI6InN1cGVyX2FkbWluIiwicmVxdWlyZVBhc3N3b3JkQ2hhbmdlIjpmYWxzZSwiaWF0IjoxNzQ5OTU1MjE4LCJleHAiOjE3NTAwNDE2MTh9.apKsacvhyQ9z09HD8z3n-GJQt45c0ajexSEhTrvJIzs';

async function testPermissions() {
  try {
    console.log('🔍 Testing GET All Users with Super Admin Token');
    console.log('===============================================');
    
    const response = await axios.get(`${BASE_URL}/api/auth/users`, {
      headers: {
        'Authorization': `Bearer ${SUPER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const users = response.data.data;
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
          console.log(`      ✅ Virtual: ${user.permissions.virtual ? '✅ YES' : '❌ NO'}`);
          console.log(`      📱 Personal: ${user.permissions.personal ? '✅ YES' : '❌ NO'}`);
          console.log(`      🌍 International Personal: ${user.permissions.internationalPersonal ? '✅ YES' : '❌ NO'}`);
          console.log(`      🌐 International Virtual: ${user.permissions.internationalVirtual ? '✅ YES' : '❌ NO'}`);
          
          // Show enabled permissions summary
          const enabled = Object.entries(user.permissions)
            .filter(([key, value]) => value === true)
            .map(([key]) => key);
          console.log(`   📊 Enabled: ${enabled.length > 0 ? enabled.join(', ') : 'None'}`);
          
          // Show creator info
          if (user.creator) {
            console.log(`   👥 Created by: ${user.creator.username}`);
          }
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
      
      // Role-based access summary
      console.log('\n🔐 ROLE-BASED ACCESS SUMMARY:');
      console.log('==============================');
      
      const roleStats = {};
      users.forEach(user => {
        if (!roleStats[user.role]) {
          roleStats[user.role] = { count: 0, permissions: {} };
        }
        roleStats[user.role].count++;
        
        if (user.permissions) {
          Object.entries(user.permissions).forEach(([perm, value]) => {
            if (!roleStats[user.role].permissions[perm]) {
              roleStats[user.role].permissions[perm] = { enabled: 0, total: 0 };
            }
            roleStats[user.role].permissions[perm].total++;
            if (value) roleStats[user.role].permissions[perm].enabled++;
          });
        }
      });
      
      Object.entries(roleStats).forEach(([role, stats]) => {
        console.log(`\n📊 ${role.toUpperCase()} (${stats.count} users):`);
        Object.entries(stats.permissions).forEach(([perm, data]) => {
          const percentage = Math.round((data.enabled / data.total) * 100);
          console.log(`   ${perm}: ${data.enabled}/${data.total} (${percentage}%)`);
        });
      });
      
    } else {
      console.log('❌ Failed to retrieve users:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }
}

testPermissions();
