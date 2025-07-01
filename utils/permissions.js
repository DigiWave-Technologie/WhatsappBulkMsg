// Define role-based permissions
const rolePermissions = {
    super_admin: ['*'],
    admin: [
        'debit_any_credits',
        'debit_sub_users',
        'manage_users',
        'manage_credits',
        'transfer_credits',
        'view_all_transactions',
        'view_user_transactions',
        'view_category_transactions',
        'check_credits',
        'manage_templates',
        'manage_campaigns',
        'view_reports',
        'manage_groups'
    ],
    reseller: [
        'debit_sub_users',
        'manage_credits',
        'transfer_credits',
        'view_user_transactions',
        'check_credits',
        'manage_templates',
        'manage_campaigns',
        'view_reports',
        'manage_groups'
    ],
    user: [
        'check_credits',
        'view_user_transactions',
        'manage_templates',
        'manage_campaigns',
        'view_reports',
        'manage_groups'
    ]
};

// Check if user has a specific permission
const checkPermission = (user, permission) => {
    if (!user || !user.role) return false;
    
    const userPermissions = rolePermissions[user.role] || [];
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true;
    
    // Check if user has the required permission
    return userPermissions.includes(permission);
};

module.exports = {
    rolePermissions,
    checkPermission
};