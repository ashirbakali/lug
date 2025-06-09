const mongoose = require("mongoose");
const { LICENSE_STATUS } = require('../utils/constants');

const licenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    licenseImage: {
        type: String,
        default: ""
    },
    isLicenseVerified: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: LICENSE_STATUS.PENDING,
        enum: Object.values(LICENSE_STATUS)
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

exports.License = mongoose.model("License", licenseSchema);