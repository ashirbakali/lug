const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    iso2: {
        type: String,
        trim: true
    },
    iso3: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    cities: [{
        type: String,
        trim: true
    }]
}, { timestamps: true });

const Location = mongoose.model("location", locationSchema);
module.exports = { Location }