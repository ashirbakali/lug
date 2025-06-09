const mongoose = require("mongoose");
const { ROLES } = require('../utils/constants');

const codeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "codeModel",
    unique: true,
  },
  codeModel: {
    type: String,
    default: ROLES.USER,
    enum: Object.values(ROLES)
  },
  code: {
    type: String,
    required: true
  },
  expireAt: {
    type: Date,
    required: true,
    default: function () {
      // 30 seconds from now
      return new Date(Date.now() + 30000);
    }
  }
}, { timestamps: true });

codeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
exports.Code = mongoose.model("code", codeSchema);