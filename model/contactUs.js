const mongoose = require("mongoose");
const contactSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

exports.ContactUs = mongoose.models.contactUs || mongoose.model("ContactUs", contactSchema);