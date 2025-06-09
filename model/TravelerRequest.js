const mongoose = require("mongoose");
const { SERVICES, STATUS, WEIGHT_UNIT } = require('../utils/constants');

// images of luggages
const imageSchema = new mongoose.Schema({
    imageName: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    imageSize: {
        type: String,
        required: false
    }
});

const travelRequestSchema = new mongoose.Schema({
    // travel post id
    travelerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    travelerpostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Travel",
        required: true
    },
    // user, the one request to the traveler
    // User can be multiple to have that service
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }],
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        sparse: true,
        set: e => e.toLowerCase(),
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    // from destination
    fromdest: {
        type: String,
        required: true,
        trim: true
    },
    // to destination
    todest: {
        type: String,
        required: true,
        trim: true
    },
    lugweight: {
        type: Number,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        required: false,
        trim: true
    },
    weightUnit: {
        type: String,
        required: false,
        default: WEIGHT_UNIT.KILOGRAM,
        enum: Object.values(WEIGHT_UNIT)
    },
    service: {
        type: String,
        default: SERVICES.IDLE,
        enum: Object.values(SERVICES)
    },
    status: {
        type: String,
        default: STATUS.PENDING,
        enum: Object.values(STATUS)
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    // images array
    images: [imageSchema]
}, { timestamps: true });

const TravelRequest = mongoose.model("TravelRequest", travelRequestSchema);

module.exports = { TravelRequest };