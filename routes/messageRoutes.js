const router = require('express').Router();

const { middleWares } = require('../middlewares');
const { messageControllers } = require('../controllers');

// Send Message route
router.post('/sendmessage', middleWares.authenticateToken, messageControllers.sendMessage);

// Get all messages route
router.get('/:chatId', middleWares.authenticateToken, messageControllers.allMessages);

module.exports = router;