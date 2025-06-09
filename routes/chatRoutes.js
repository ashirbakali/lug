const router = require('express').Router();

const { middleWares } = require('../middlewares');
const { chatControllers } = require('../controllers');

// Create New Chat and get chat (as well as fetch all chats)
router.route('/').post(middleWares.authenticateToken, chatControllers.accessChat).get(middleWares.authenticateToken, chatControllers.fetchChat)

module.exports = router