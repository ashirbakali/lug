const jwt = require('jsonwebtoken');

const { User } = require('../model/user');
const { sendResponse } = require('../utils/sendResponse');
const { logger } = require('../utils/logger');
const { ROLES, STATUS_CODES } = require('../utils/constants');

// Token Function
exports.authenticateToken = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
            const user = await User.findById({ _id: decoded._id });
            if (!user) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "User not found"));
            if (user && user?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Your Account has been deleted, Please Contact the administrator"));
            if (user && user?.isBlocked) return res.status(STATUS_CODES.FORBIDDEN).send(sendResponse(false, `Your account is blocked because of ${user?.isBlockedReason}`));

            user.token = token;
            req.user = user
            next();

        } catch (error) {
            logger.error(error.message);
            res.status(STATUS_CODES.UNAUTHORIZED).send(sendResponse(false, error.message));
        }
    }

    if (!token) {
        res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Not Authorize, No Token"));
    }
}

// auth Admin
// token middleware that make sure to show anything for admin
exports.isAdmin = async (req, res, next) => {
    if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(STATUS_CODES.FORBIDDEN).send(sendResponse(false, "Access denied. Admin role required."));
    }
    next();
}