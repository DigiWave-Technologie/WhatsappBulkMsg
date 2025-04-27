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
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    if (role && !['super_admin', 'admin', 'reseller', 'user'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role'
        });
    }

    next();
};

const validateUpdateUser = (req, res, next) => {
    const { firstName, lastName, mobileNumber, role } = req.body;

    if (role && !['super_admin', 'admin', 'reseller', 'user'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role'
        });
    }

    next();
};

module.exports = {
    validateLogin,
    validateCreateUser,
    validateUpdateUser
}; 