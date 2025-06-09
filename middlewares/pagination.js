// Pagination for admin panel tables
const { logger } = require('../utils/logger');
const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES, ROLES } = require('../utils/constants');

exports.paginatedResults = (model, role, notDeleted, populate, select) => async (req, res, next) => {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {}
    let condition = {}
    if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
        condition = { isDeleted: false, $or: [{ role: ROLES.ADMIN }, { role: ROLES.SUPER_ADMIN }] }
    } else if (role === ROLES.USER) {
        condition = { isDeleted: false, role: ROLES.USER }
    } else {
        condition = { isDeleted: false }
    }

    if (endIndex < await model?.find(condition).countDocuments().exec()) { results.next = { page: page + 1, limit: limit } }
    if (startIndex > 0) { results.previous = { page: page - 1, limit: limit } }

    try {
        if (notDeleted) {
            results.results = await model.find().populate(populate, select).sort({ _id: -1 }).limit(limit).skip(startIndex).exec();

        } else {
            results.results = await model.find(condition).populate(populate, select).sort({ _id: -1 }).limit(limit).skip(startIndex).exec();
        }
        results.limit = limit;
        results.page = startIndex;
        res.paginatedResults = results;
        next();

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}