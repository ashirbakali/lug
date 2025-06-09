const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { ROLES, IMAGES, ONLINE_STATUS } = require('../utils/constants');

//reviews is in array so we have to create seperate schema for that
const reviewSchema = mongoose.Schema({
  // logged in user
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    require: true
  },
  message: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0, max: 5
  }
}, { timeStamps: true });

const userSchema = new mongoose.Schema({
  cusId: {
    type: String,
    required: false,
    default: ''
  },
  travelerStripeId: {
    type: String,
    required: false,
    default: null
  },
  travelerStripeStatus: {
    type: String,
    required: false,
    default: ''
  },
  travelerStripeImageVerified: {
    type: Boolean,
    default: false
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  facebookId: {
    type: String,
    sparse: true
  },
  uid: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    sparse: true,
    set: (e) => e.toLowerCase(),
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phoneNumber: {
    type: Number,
    required: false,
    default: 0
  },
  nickname: {
    type: String,
    required: false,
    trim: true
  },
  age: {
    type: Number,
    required: false,
  },
  city: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false,
    trim: true,
    select: false
    // match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
  },
  confirmPassword: {
    type: String,
    required: false,
    trim: true,
    select: false
  },
  profile: {
    type: String,
    default: IMAGES.DEFAULT_IMAGE
  },
  license: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "License",
    required: false
  },
  licenseImage: {
    type: String,
    default: ""
  },
  isLicenseVerified: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  fcmToken: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  onlineStatus: {
    type: String,
    default: ONLINE_STATUS.IDLE,
    enum: Object.values(ONLINE_STATUS)
  },
  chatFriends: [{
    userId: String,
    chat: String,
    contentType: String,
    senderId: { type: String, default: "" },
    read: { type: Boolean, default: false },
    createdDate: {
      type: Date,
      default: () => Date.now()
    }
  }],
  role: {
    type: String,
    default: ROLES.USER,
    enum: Object.values(ROLES)
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isBlockedReason: {
    type: String,
    default: ''
  },
  isActiveReason: {
    type: String,
    default: ''
  },
  //here I change review with reviews schema
  reviews: [reviewSchema]
}, { timestamps: true });

// return json web token for specific user
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, }, process.env.JWTPRIVATEKEY || 'my secret key', { expiresIn: process.env.JWT_EXPIRATION || "7d" });
  return token;
}

// Check if email us already taken or not
userSchema.statics.isEmailTaken = async function (email) {
  const user = await this.findOne({ email });
  return !!user;
}

// check if password is match with database
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
}

// check if Email is Deleted
userSchema.statics.isEmailDeleted = async function (email) {
  const user = await this.findOne({ email: email });
  if (user.isDeleted) return !user;
}

// check if Email template is Valid
userSchema.statics.isEmailValid = async function (email) {
  if (email) {
    return !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
}

// check if Password template is Valid
userSchema.statics.isPasswordValid = async function (password) {
  if (password) {
    return !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[a-zA-Z\d@#$!%*?&]{8,}$/);
  }
}

// check if Email template is Valid
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

exports.User = mongoose.model("user", userSchema);