const User = require('../models/User');

// Define role-based permissions
const rolePermissions = {
    super_admin: [
        'manage_users',
        'manage_credits',
        'manage_templates',
        'approve_templates',
        'manage_campaigns',
        'view_analytics',
        'manage_api_keys',
        'manage_settings',
        'manage_pricing_plans'
    ],
    admin: [
        'manage_users',
        'manage_credits',
        'manage_templates',
        'approve_templates',
        'manage_campaigns',
        'view_analytics'
    ],
    reseller: [
        'manage_credits',
        'manage_templates',
        'manage_campaigns',
        'view_analytics'
    ],
    user: [
        'manage_templates',
        'manage_campaigns',
        'view_analytics'
    ]
};

// Middleware to check if user has required permission
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            // SuperAdmin has all permissions
            if (user.role === 'super_admin') {
                return next();
            }

            // Check if user's role has the required permission
            const userPermissions = rolePermissions[user.role] || [];
            if (!userPermissions.includes(requiredPermission)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to perform this action' 
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error checking permissions' 
            });
        }
    };
};

// Helper function to check if user has a specific permission
const hasPermission = (user, permission) => {
    if (user.role === 'super_admin') {
        return true;
    }
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
};

// Middleware to check if user has any of the required permissions
const checkAnyPermission = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            // SuperAdmin has all permissions
            if (user.role === 'super_admin') {
                return next();
            }

            // Check if user's role has any of the required permissions
            const userPermissions = rolePermissions[user.role] || [];
            const hasAnyPermission = permissions.some(permission => 
                userPermissions.includes(permission)
            );

            if (!hasAnyPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to perform this action' 
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error checking permissions' 
            });
        }
    };
};

// Middleware to check if user has all of the required permissions
const checkAllPermissions = (permissions) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            // SuperAdmin has all permissions
            if (user.role === 'super_admin') {
                return next();
            }

            // Check if user's role has all of the required permissions
            const userPermissions = rolePermissions[user.role] || [];
            const hasAllPermissions = permissions.every(permission => 
                userPermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have all required permissions to perform this action' 
                });
            }

            next();
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error checking permissions' 
            });
        }
    };
};

module.exports = {
    checkPermission,
    hasPermission,
    checkAnyPermission,
    checkAllPermissions,
    rolePermissions
}; 