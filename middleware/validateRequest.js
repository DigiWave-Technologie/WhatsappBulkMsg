// Password strength validation
const validatePasswordStrength = (password) => {
    // Minimum 8 characters, at least one uppercase letter, one lowercase letter, 
    // one number and one special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    next();
};

const validateCreateUser = (req, res, next) => {
    const { username, password, role, permissions, rolePermissions, email, firstName, lastName, mobileNumber } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    // Validate password strength
    if (!validatePasswordStrength(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
    }

    // Validate role if provided
    if (role && !['super_admin', 'admin', 'reseller', 'user'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role'
        });
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    // Validate mobile number format if provided
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format'
        });
    }

    // Validate UI-specific permissions if provided
    if (permissions) {
        const validPermissions = ['virtual', 'personal', 'internationalPersonal', 'internationalVirtual'];
        const invalidPermissions = Object.keys(permissions).filter(p => !validPermissions.includes(p));
        
        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid permissions: ${invalidPermissions.join(', ')}`
            });
        }

        // Ensure all permission values are boolean
        const nonBooleanPermissions = Object.entries(permissions)
            .filter(([_, value]) => typeof value !== 'boolean')
            .map(([key]) => key);

        if (nonBooleanPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Permission values must be boolean for: ${nonBooleanPermissions.join(', ')}`
            });
        }

        // Ensure all required permissions are provided
        const missingPermissions = validPermissions.filter(p => !Object.keys(permissions).includes(p));
        if (missingPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required permissions: ${missingPermissions.join(', ')}`
            });
        }
    }

    // Validate role-based permissions if provided
    if (rolePermissions) {
        const validRolePermissions = [
            'canCreateUsers',
            'canUpdateUsers',
            'canDeleteUsers',
            'canViewAllUsers',
            'canManageAdmins',
            'canManageResellers',
            'canManageUsers',
            'canViewAnalytics',
            'canManageSettings',
            'canManagePricingPlans',
            'canViewSystemStats',
            'canManageAllCampaigns',
            'canManageAllReports',
            'canManageAllGroups',
            'canManageAllTemplates',
            'canManageAllCredits',
            'canManageAllAPIKeys',
            'hasUnlimitedCredits'
        ];

        const invalidRolePermissions = Object.keys(rolePermissions)
            .filter(p => !validRolePermissions.includes(p));
        
        if (invalidRolePermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid role permissions: ${invalidRolePermissions.join(', ')}`
            });
        }

        // Ensure all role permission values are boolean
        const nonBooleanRolePermissions = Object.entries(rolePermissions)
            .filter(([_, value]) => typeof value !== 'boolean')
            .map(([key]) => key);

        if (nonBooleanRolePermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Role permission values must be boolean for: ${nonBooleanRolePermissions.join(', ')}`
            });
        }
    }

    next();
};

// Helper function to validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate mobile number format
const validateMobileNumber = (number) => {
    const mobileRegex = /^[0-9]{10,15}$/;  // Accepts 10-15 digits
    return mobileRegex.test(number.replace(/[^0-9]/g, '')); // Remove non-digits before testing
};

const validateUpdateUser = (req, res, next) => {
    const { firstName, lastName, mobileNumber, role, permissions, rolePermissions } = req.body;

    if (role && !['super_admin', 'admin', 'reseller', 'user'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role'
        });
    }

    // Validate mobile number format if provided
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid mobile number format'
        });
    }

    // Validate permissions if being updated
    if (permissions) {
        const validPermissions = ['virtual', 'personal', 'internationalPersonal', 'internationalVirtual'];
        const invalidPermissions = Object.keys(permissions).filter(p => !validPermissions.includes(p));
        
        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid permissions: ${invalidPermissions.join(', ')}`
            });
        }

        // Ensure all permission values are boolean
        const nonBooleanPermissions = Object.entries(permissions)
            .filter(([_, value]) => typeof value !== 'boolean')
            .map(([key]) => key);

        if (nonBooleanPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Permission values must be boolean for: ${nonBooleanPermissions.join(', ')}`
            });
        }
    }

    // Validate role permissions if being updated
    if (rolePermissions) {
        const validRolePermissions = [
            'canCreateUsers',
            'canUpdateUsers',
            'canDeleteUsers',
            'canViewAllUsers',
            'canManageAdmins',
            'canManageResellers',
            'canManageUsers',
            'canViewAnalytics',
            'canManageSettings',
            'canManagePricingPlans',
            'canViewSystemStats',
            'canManageAllCampaigns',
            'canManageAllReports',
            'canManageAllGroups',
            'canManageAllTemplates',
            'canManageAllCredits',
            'canManageAllAPIKeys',
            'hasUnlimitedCredits'
        ];

        const invalidRolePermissions = Object.keys(rolePermissions)
            .filter(p => !validRolePermissions.includes(p));
        
        if (invalidRolePermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid role permissions: ${invalidRolePermissions.join(', ')}`
            });
        }

        // Ensure all role permission values are boolean
        const nonBooleanRolePermissions = Object.entries(rolePermissions)
            .filter(([_, value]) => typeof value !== 'boolean')
            .map(([key]) => key);

        if (nonBooleanRolePermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Role permission values must be boolean for: ${nonBooleanRolePermissions.join(', ')}`
            });
        }
    }

    next();
};

module.exports = {
    validateLogin,
    validateCreateUser,
    validateUpdateUser,
    validatePasswordStrength
}; 