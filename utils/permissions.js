// Define role-based permissions
const rolePermissions = {
    super_admin: ['*'],
    admin: [
        'manage_users',
        'manage_credits',
        'manage_templates',
        'manage_campaigns',
        'view_reports',
        'manage_groups'
    ],
    reseller: [
        'manage_credits',
        'manage_templates',
        'manage_campaigns',
        'view_reports',
        'manage_groups'
    ],
    user: [
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