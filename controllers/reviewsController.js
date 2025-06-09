const { Review } = require("../model/addReviews"),
    { sendResponse } = require("../utils/sendResponse"),
    { isEmpty } = require("../utils/isEmpty"),
    { errorHandling } = require("../utils/errorhandling"),
    { FIELDS, STATUS_CODES, ROLES } = require("../utils/constants");

// Add a new review Controller
exports.addReview = async (req, res) => {
    try {
        if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

        await Review.create({ ...req.body });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Review Added"));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get all reviews Controller
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find();
        let reviewsArray = [];

        if (req.user?.role === ROLES.USER) {
            for (const review of reviews) {
                if (!review?.isDeleted) reviewsArray.push(review?.content);
            }
            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get All Reviews", reviewsArray));
        } else {
            const page = parseInt(req.query.page);
            const limit = parseInt(req.query.limit);
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const results = {}

            if (endIndex < await Review?.find().countDocuments().exec()) { results.next = { page: page + 1, limit: limit } }
            if (startIndex > 0) { results.previous = { page: page - 1, limit: limit } }
            results.results = await Review.find().sort({ _id: -1 }).limit(limit).skip(startIndex).exec();
            let message = results.results.length > 0 ? "All Reviews For Admin" : "No results found"
            const data = { results: results, count: await Review?.find().countDocuments().exec() }

            res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));
        }

    } catch (error) {
        errorHandling(error, res);
    }
}

// Delete Review by admin controller
exports.deleteReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Review Id"));
        if (review?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Review Already Deleted"));
        if (req?.user?.role !== ROLES.SUPER_ADMIN) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Super Admin Required"));

        review = await Review.findByIdAndUpdate(review?.id, { isDeleted: true }, { new: true });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Review Deleted"));

    } catch (error) {
        errorHandling(error, res);
    }
}

// update the review by admin controller
exports.updateReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Review Id"));
        if (review?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Deleted Review Cannot Be Update"));
        if (req?.user?.role !== ROLES.SUPER_ADMIN) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Super Admin Required"));

        review = await Review.findByIdAndUpdate(review?.id, { content: req.body.content }, { new: true });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Update Review Successfully"));

    } catch (error) {
        errorHandling(error, res);
    }
}