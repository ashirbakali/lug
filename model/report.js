const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    reportReason: {
        type: String,
        required: true,
        trim: true
    },
    // user who got red flag
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    reportByUserId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

exports.Report = mongoose.model("report", reportSchema);