const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: [true, "sender field is required"],
    },
    receiver: {
        type: String,
        required: [true, "receiver field is required"],
    },
    message: {
        type: String,
        required: [true, "message field is required"],
    },
    type: {
        type: String,
        required: [true, "type field is required"],
    },
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message"
    }
}, { timestamps: true });

const Chat = mongoose.model("chat", chatSchema);
module.exports = { Chat }