const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES } = require('../utils/constants');

const { Chat } = require('../model/chat');
const { User } = require('../model/user');
const { logger } = require('../utils/logger');

// Access chat for specific user (create new if not available previously)
exports.accessChat = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "User id params not send with request"));

        // check if chat with this user exist, we have all the final data in isChat
        var isChat = await Chat.find({
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } }
            ]
        }).populate("users").populate("latestMessage");
        // users array in chat model (except password)

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "fullname profile email"
        });

        if (isChat.length > 0) {
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Chat with specific user", isChat[0]));
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId]
            }
            // create chat
            const createdChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createdChat.id }).populate("users");

            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Create Chat With specific user", fullChat));
        }
    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Fetch All Chats for specific user controller
exports.fetchChat = async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users").populate("latestMessage").sort({ updatedAt: -1 }).then(async (result) => {
                result = await User.populate(result, {
                    path: "latestMessage.sender",
                    select: "fullname profile email"
                })
                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Chats", result));
            });

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}