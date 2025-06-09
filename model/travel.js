const mongoose = require("mongoose");
const { WEIGHT_UNIT, STATUS, SERVICES, COST_UNIT } = require('../utils/constants');

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

const travelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  requestToTravelerId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "TravelRequest",
    required: false
  }],
  // from destination
  fromdest: {
    type: String,
    required: true,
    trim: true,
  },
  // to destination
  todest: {
    type: String,
    required: true,
    trim: true,
  },
  totalWeight: {
    type: Number,
    required: true
  },
  remainingWeight: {
    type: Number,
    required: true
  },
  weightUnit: {
    type: String,
    required: true,
    enum: Object.values(WEIGHT_UNIT)
  },
  costPerKg: {
    type: Number,
    required: true
  },
  costUnit: {
    type: String,
    required: true,
    enum: Object.values(COST_UNIT)
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  provideDelivery: {
    type: Boolean,
    default: false
  },
  // lets add flight details
  bookingDate: {
    type: Date,
    required: true
  },
  flightFrom: {
    type: String,
    required: false
  },
  departureDate: {
    type: Date,
    required: true,
  },
  arrivalDate: {
    type: Date,
    required: true,
  },
  flightTo: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: STATUS.PENDING,
    enum: Object.values(STATUS)
  },
  service: {
    type: String,
    default: SERVICES.IDLE,
    enum: Object.values(SERVICES)
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  images: [imageSchema],
  message: {
    type: String,
    required: false,
    trim: true
  }
}, { timestamps: true });

exports.Travel = mongoose.model("Travel", travelSchema);