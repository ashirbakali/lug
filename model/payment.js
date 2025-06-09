const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    reciever: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    amount: {
        type: Number,
        required: true
    },
    travel: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "Travel"
    },
    travelRequest: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "TravelRequest"
    },
    bankDetails: {
        type: Object,
        required: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Payment = mongoose.model("payment", paymentSchema);
module.exports = { Payment }