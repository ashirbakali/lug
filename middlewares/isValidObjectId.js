const mongoose = require('mongoose');

const { STATUS_CODES } = require('../utils/constants');
const { sendResponse } = require('../utils/sendResponse')

exports.isValidObjectId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid ID"));
    }
    next();
}