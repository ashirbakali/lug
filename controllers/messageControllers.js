const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES } = require('../utils/constants');
const { logger } = require('../utils/logger');
const { isEmpty } = require('../utils/isEmpty');

const { Chat } = require('../model/chat');
const { User } = require('../model/user');
const { Message } = require('../model/message');

// Send Text Message Controller
exports.sendMessage = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please fill all the fields"));
        const { content, chatId } = req.body;

        // Send New Message
        var newMessage = { sender: req.user._id, content: content, chat: chatId }

        var message = await Message.create(newMessage);
        message = await message.populate("sender", "fullname profile");
        message = await message.populate("chat")
        message = await User.populate(message, { path: "chat.users", select: "fullname profile email" });

        // save latest message to chat to show that message on front
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message }, { new: true });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Message Send Successfully", message));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get all messages controller
exports.allMessages = async (req, res) => {
    try {
        const message = await Message.find({ chat: req.params.chatId })
            .populate("sender", "fullname profile email").populate("chat");

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get All Messages for particular chat", message));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}