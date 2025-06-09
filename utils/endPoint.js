const { sendResponse } = require('./sendResponse');
const { STATUS_CODES } = require('./constants');

// Call if url is broken or invalid
exports.endPoint = (req, res) => {
    res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "Endpoint does not exist."));
}