const mongoose = require("mongoose");

const { NOTIF_REDIRECT } = require('../utils/constants');

const notificationSchema = new mongoose.Schema({
    // user, the one request to the traveler
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    // travel post id
    travelerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    travelerpostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Travel",
        required: false
    },
    travelRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TravelRequest",
        required: false
    },
    details: {
        type: String,
        required: false
    },
    NotifRedirect: {
        type: String,
        default: NOTIF_REDIRECT.HOME,
        enum: Object.values(NOTIF_REDIRECT)
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model("notification", notificationSchema);

module.exports = { Notification }