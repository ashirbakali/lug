const { logger } = require('./logger');
const { STATUS_CODES } = require('./constants');
const { sendResponse } = require('./sendResponse');

exports.errorHandling = (error, res) => {
    logger.error(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
}