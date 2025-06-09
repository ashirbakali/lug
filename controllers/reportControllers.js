const { Report } = require('../model/report');
const { Notification } = require('../model/notification');
const { sendResponse } = require('../utils/sendResponse');
const { errorHandling } = require('../utils/errorhandling');
const { STATUS_CODES } = require('../utils/constants');

// User Report to vulnerability (any other user's report)
exports.reportUser = async (req, res) => {
    try {
        const report = await Report.create({ userId: req.params.id, reportByUserId: req.user._id, reportReason: req.body.reportReason });
        await Notification.create({ userId: req.user.id, travelerId: req.params.id, isAdmin: true, details: req.body.reportReason });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Report User", report));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get all reports for admin Controller
exports.getAllReports = async (req, res) => {
    try {
        const reportCount = await Report.find({ isDeleted: false }).countDocuments();
        const data = { count: reportCount, results: res.paginatedResults }
        let message = res.paginatedResults ? "Get All Reports" : "No reports Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Get Report Details by Id for Admin Controller
exports.getAReportDetailsById = async (req, res) => {
    try {
        const populateOptions = [
            { path: 'userId', select: 'fullname email profile isActive isActiveReason isBlocked isBlockedReason' },
            { path: 'reportByUserId', select: 'fullname email profile isActive isActiveReason isBlocked isBlockedReason' }
        ]
        let report = await Report.findById(req.params.id).populate(populateOptions);
        if (!report) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Invalid Report Id"));
        if (report?.isDeleted) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Report Doesn't Exist"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Report By ID", report));

    } catch (error) {
        errorHandling(error, res);
    }
}