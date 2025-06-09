const router = require('express').Router();

const { contactController } = require("../controllers");
const { middleWares } = require("../middlewares");

// send a message route
router.post("/contactus", middleWares.authenticateToken, contactController.contactPost);

module.exports = router;