const { authenticateToken, isAdmin } = require('./authenticateToken');
const { isValidObjectId } = require('./isValidObjectId');
const { paginatedResults } = require('./pagination');
const { asyncHandler } = require('./asyncHandler');

const middleWares = {
    authenticateToken,
    isAdmin,
    isValidObjectId,
    paginatedResults,
    asyncHandler
}

module.exports = { middleWares }