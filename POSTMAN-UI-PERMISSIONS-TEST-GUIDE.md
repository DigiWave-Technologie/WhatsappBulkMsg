# ✅ Enhanced Postman Collection - UI Permissions Testing

## 🎯 What's Been Updated

I've enhanced your existing Postman collection (`User_Management_API.postman_collection.json`) to include comprehensive UI permissions testing for the 4 boolean fields:

- **`virtual`** - Virtual campaigns
- **`personal`** - Personal campaigns  
- **`internationalPersonal`** - International Personal campaigns
- **`internationalVirtual`** - International Virtual campaigns

## 🔧 Collection Enhancements

### 1. **Enhanced Login Tests**
- ✅ **Login - Super Admin** (existing, enhanced with permission validation)
- ✅ **Login - Admin** (existing, enhanced with permission validation)  
- ✅ **Login - Reseller** (existing, enhanced with permission validation)
- 🆕 **Login - User1 (Virtual Only)** - NEW test with permission validation
- 🆕 **Login - User2 (Personal Only)** - NEW test with permission validation

### 2. **Enhanced GET Users Tests**
- ✅ **Get All Users (Super Admin)** - Enhanced with comprehensive permission validation
- ✅ **Get All Users (Admin)** - Enhanced with role-based access validation
- ✅ **Get All Users (Reseller)** - Enhanced with limited access validation
- 🆕 **Get All Users (User Role - Should Fail)** - NEW test to verify 403 error

### 3. **New Environment Variables**
- `user1_token` - Token for user1 (virtual only)
- `user2_token` - Token for user2 (personal only)
- `user1_id` - User1's ID for further testing
- `user2_id` - User2's ID for further testing

## 📊 Test Coverage Matrix

| Test Case | User Role | Expected Result | Permissions Validated |
|-----------|-----------|-----------------|----------------------|
| Login - Super Admin | super_admin | ✅ Success | All 4 permissions = true |
| Login - Admin | admin | ✅ Success | 3 permissions = true, intlVirtual = false |
| Login - Reseller | reseller | ✅ Success | 2 permissions = true, intl* = false |
| Login - User1 | user | ✅ Success | Only virtual = true |
| Login - User2 | user | ✅ Success | Only personal = true |
| GET Users - Super Admin | super_admin | ✅ See all users | Validate all user permissions |
| GET Users - Admin | admin | ✅ See filtered users | Validate visible user permissions |
| GET Users - Reseller | reseller | ✅ See limited users | Validate visible user permissions |
| GET Users - User | user | ❌ 403 Forbidden | Access denied |

## 🚀 How to Run the Tests

### Step 1: Import Updated Collection
1. Open Postman
2. Import the updated `User_Management_API.postman_collection.json`
3. Import the updated `User_Management_Environment.postman_environment.json`

### Step 2: Set Environment
1. Select "User Management Environment"
2. Verify these variables are set:
   - `base_url`: http://localhost:3000
   - `superadmin_username`: superadmin1
   - `superadmin_password`: SuperAdmin@123
   - `admin_username`: admin1
   - `admin_password`: AdminUser@123
   - `reseller_username`: reseller1
   - `reseller_password`: Reseller@123

### Step 3: Run Tests in Order
1. **Authentication Tests** (run all login tests first)
2. **User Management Tests** (run GET users tests)

### Step 4: Verify Results
Check the test results tab for:
- ✅ All login tests pass with correct permissions
- ✅ Super Admin sees all users with correct permissions
- ✅ Admin/Reseller see filtered users
- ✅ User role gets 403 error

## 🔍 Key Test Validations

### Login Response Validation
```javascript
// Each login test validates:
pm.test('User has correct permissions', function () {
    var permissions = jsonData.data.user.permissions;
    pm.expect(permissions.virtual).to.be.true/false;
    pm.expect(permissions.personal).to.be.true/false;
    pm.expect(permissions.internationalPersonal).to.be.true/false;
    pm.expect(permissions.internationalVirtual).to.be.true/false;
});
```

### GET Users Response Validation
```javascript
// Validates all users have permission structure
pm.test('Users have UI permissions structure', function () {
    users.forEach(function(user) {
        pm.expect(user.permissions).to.have.property('virtual');
        pm.expect(user.permissions).to.have.property('personal');
        pm.expect(user.permissions).to.have.property('internationalPersonal');
        pm.expect(user.permissions).to.have.property('internationalVirtual');
    });
});
```

### Specific User Permission Validation
```javascript
// Validates specific test users have expected permissions
var superAdmin = users.find(u => u.username === 'superadmin1');
if (superAdmin) {
    pm.expect(superAdmin.permissions.virtual).to.be.true;
    pm.expect(superAdmin.permissions.personal).to.be.true;
    pm.expect(superAdmin.permissions.internationalPersonal).to.be.true;
    pm.expect(superAdmin.permissions.internationalVirtual).to.be.true;
}
```

## 📈 Expected Test Results

### ✅ Successful Tests
- **5 Login tests** - All should pass with correct permission validation
- **3 GET Users tests** - Super Admin, Admin, Reseller should pass
- **1 Access Control test** - User role should get 403

### 📊 Permission Matrix Validation
| User | Virtual | Personal | Intl Personal | Intl Virtual |
|------|---------|----------|---------------|--------------|
| superadmin1 | ✅ | ✅ | ✅ | ✅ |
| admin1 | ✅ | ✅ | ✅ | ❌ |
| reseller1 | ✅ | ✅ | ❌ | ❌ |
| user1 | ✅ | ❌ | ❌ | ❌ |
| user2 | ❌ | ✅ | ❌ | ❌ |

## 🎯 Console Output Examples

When tests run successfully, you'll see console messages like:
```
✅ SuperAdmin permissions validated
✅ Admin permissions validated  
✅ User1 (virtual only) permissions validated
✅ User2 (personal only) permissions validated
✅ User role correctly denied access to users endpoint
```

## 🔧 Troubleshooting

### If Tests Fail:
1. **Check server is running**: `npm start` in project directory
2. **Verify test users exist**: Run `node scripts/setupTestUsers.js`
3. **Check environment variables**: Ensure all credentials are correct
4. **Token expiry**: Re-run login tests to get fresh tokens

### Common Issues:
- **401 Unauthorized**: Token expired, re-run login tests
- **403 Forbidden**: User doesn't have required permissions (expected for user role)
- **404 Not Found**: Check base_url is correct
- **Connection Error**: Ensure server is running on localhost:3000

## ✅ Success Criteria

Your Postman collection is working correctly if:
1. ✅ All 5 login tests pass with permission validation
2. ✅ Super Admin can see all users with correct permissions
3. ✅ Admin/Reseller see filtered user lists
4. ✅ User role gets 403 when trying to access users
5. ✅ All users in responses have the 4 UI permission fields
6. ✅ Permission values match the expected matrix above

The enhanced collection now provides comprehensive testing of your UI permissions system! 🚀
