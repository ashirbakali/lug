const { ContactUs } = require("../model/contactUs");
const { isEmpty } = require('../utils/isEmpty');
const { sendResponse } = require("../utils/sendResponse");
const { logger } = require('../utils/logger');
const { STATUS_CODES } = require('../utils/constants');

// send a message controller
exports.contactPost = async (req, res) => {
  try {
    if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));
    const { email } = req.body;

    // Validate email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid email format"));

    await ContactUs.create({ ...req.body });
    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Contact form is submitted"));

  } catch (error) {
    logger.error(error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
  }
}