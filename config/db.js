const mongoose = require("mongoose");
require("dotenv").config();

const { DATABASE } = require('../utils/constants');
const { logger } = require('../utils/logger');

module.exports = () => {
  mongoose.set("strictQuery", false);

  try {
    mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000
    });
    console.log(DATABASE.SUCCESS);
  } catch (error) {
    logger.error(error.message);
    console.log(DATABASE.FAIL, error);
  }
}