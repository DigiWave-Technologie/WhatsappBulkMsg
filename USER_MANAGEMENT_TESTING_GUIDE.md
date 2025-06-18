# 🧪 User Management Testing Guide

This guide provides comprehensive testing instructions for all user management features in the WhatsApp Bulk Messaging System.

## 📋 Prerequisites

1. **Server Running**: Make sure your server is running on `http://localhost:3000`
2. **MongoDB**: Ensure MongoDB is running and accessible
3. **Dependencies**: All npm packages installed (`npm install`)

## 🚀 Quick Start Testing

### Option 1: Automated Script Testing

```bash
# Setup test users and run all tests
node scripts/runCompleteUserTests.js

# Or run individual scripts
node scripts/setupTestUsers.js
node scripts/testUserManagement.js
```

### Option 2: Postman Testing

1. **Import Collection**: Import `postman/UserManagementComplete.postman_collection.json`
2. **Import Environment**: Import `postman/UserManagementComplete.postman_environment.json`
3. **Setup Users**: Run `node scripts/setupTestUsers.js` first
4. **Run Collection**: Execute the collection in Postman

## 👥 Test User Credentials

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Super Admin | `superadmin1` | `SuperAdmin@123` | superadmin1@test.com |
| Admin | `admin1` | `AdminUser@123` | admin1@test.com |
| Reseller | `reseller1` | `Reseller@123` | reseller1@test.com |
| User | `user1` | `TestUser@123` | user1@test.com |
| User | `user2` | `TestUser@123` | user2@test.com |

## 🔗 API Endpoints to Test

### 🔐 Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/change-password
```

**Test Cases:**
- ✅ Login with valid credentials for each role
- ✅ Login with invalid credentials (should fail)
- ✅ Logout with valid token
- ✅ Change password with correct current password
- ❌ Change password with incorrect current password

### 👥 User Management Endpoints

```http
POST /api/auth/createUser
GET  /api/auth/users
PUT  /api/auth/update-user/:id
DELETE /api/auth/delete-user/:id
```

**Test Cases:**
- ✅ Super Admin creates Admin, Reseller, User
- ✅ Admin creates Reseller, User
- ✅ Reseller creates User
- ❌ User tries to create another User (should fail)
- ✅ Each role gets users (different visibility)
- ✅ Update user information
- ✅ Delete user (role-based permissions)

### 🔒 Security Features

```http
POST /api/auth/lock-account/:userId
POST /api/auth/unlock-account/:userId
POST /api/auth/force-password-reset/:userId
GET  /api/auth/security-logs
GET  /api/auth/security-audit/:userId
GET  /api/auth/active-sessions
GET  /api/auth/active-sessions/:userId
```

**Test Cases:**
- ✅ Super Admin locks user account
- ❌ Locked user cannot login
- ✅ Super Admin unlocks user account
- ✅ Unlocked user can login again
- ✅ View security logs
- ✅ View security audit for specific user
- ✅ View active sessions

### 🔑 API Key Management

```http
POST /api/auth/generate-api-key
POST /api/auth/revoke-api-key
```

**Test Cases:**
- ✅ Generate API key for each role
- ✅ Use API key for authentication
- ✅ Revoke API key
- ❌ Use revoked API key (should fail)

### 👨‍💼 Admin Features

```http
POST /api/auth/admin/change-user-password/:userId
GET  /api/auth/admin/user-credentials
```

**Test Cases:**
- ✅ Super Admin changes user password
- ✅ Get all user credentials (Super Admin only)
- ❌ Non-admin tries admin endpoints (should fail)

## 🧪 Detailed Test Scenarios

### Scenario 1: Role Hierarchy Testing

1. **Super Admin** creates an **Admin**
2. **Admin** creates a **Reseller**
3. **Reseller** creates a **User**
4. **User** tries to create another **User** (should fail)

### Scenario 2: Permission Testing

1. **Super Admin** views all users
2. **Admin** views users (limited scope)
3. **Reseller** views users (more limited)
4. **User** views users (most limited or denied)

### Scenario 3: Security Testing

1. **Super Admin** locks a **User** account
2. **User** tries to login (should fail)
3. **Super Admin** unlocks the account
4. **User** can login again

### Scenario 4: Password Management

1. **User** changes own password
2. **Super Admin** forces password reset for **User**
3. **Admin** changes **User** password

### Scenario 5: API Key Testing

1. Each role generates API key
2. Test API authentication with key
3. Revoke API key
4. Test with revoked key (should fail)

## 📊 Expected Test Results

### ✅ Should Succeed

- Super Admin: All operations
- Admin: Create/manage Resellers and Users
- Reseller: Create/manage Users
- User: Basic operations only

### ❌ Should Fail

- User creating other users
- Non-admin accessing admin endpoints
- Login with locked account
- Using revoked API keys
- Invalid credentials

## 🔍 Debugging Tips

1. **Check Server Logs**: Monitor console for errors
2. **Database State**: Verify users are created correctly
3. **Token Validity**: Ensure tokens are not expired
4. **Permissions**: Check role permissions in database
5. **Network**: Verify API endpoints are accessible

## 📝 Test Checklist

### Authentication
- [ ] Login Super Admin
- [ ] Login Admin
- [ ] Login Reseller
- [ ] Login User
- [ ] Invalid login attempts
- [ ] Logout functionality

### User Creation
- [ ] Super Admin creates Admin
- [ ] Admin creates Reseller
- [ ] Reseller creates User
- [ ] User creation fails for unauthorized roles

### User Management
- [ ] Get all users (role-based visibility)
- [ ] Update user information
- [ ] Delete users (permission-based)

### Security Features
- [ ] Account locking/unlocking
- [ ] Security logs access
- [ ] Security audit retrieval
- [ ] Active sessions monitoring

### API Key Management
- [ ] Generate API keys
- [ ] API key authentication
- [ ] Revoke API keys

### Password Management
- [ ] Change own password
- [ ] Force password reset
- [ ] Admin password changes

## 🎯 Success Criteria

All tests should pass with:
- ✅ Proper role-based access control
- ✅ Security features working correctly
- ✅ API endpoints responding appropriately
- ✅ Database operations completing successfully
- ✅ Error handling for unauthorized operations

## 📞 Support

If tests fail, check:
1. Server is running on correct port
2. Database connection is active
3. Environment variables are set
4. All dependencies are installed

Happy Testing! 🚀
