const router = require("express").Router();

const { Report } = require("../model/report");
const { middleWares } = require("../middlewares");
const { reportControllers } = require("../controllers")
const { FLOW_API_CONSTANTS } = require("../utils/constants");

// User Report to vulnerability (any other user's report)
router.post(`${FLOW_API_CONSTANTS.REPORT_USER}/:id`, middleWares.authenticateToken, reportControllers.reportUser);

// Get all reports for admin Controller
router.get(FLOW_API_CONSTANTS.ALL_REPORTS, middleWares.authenticateToken, middleWares.isAdmin, middleWares.paginatedResults(Report, "", false, "userId reportByUserId", ""), reportControllers.getAllReports);

// Get Report Details by Id for Admin
router.get(`${FLOW_API_CONSTANTS.REPORT_DETAILS_BY_ID}/:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, reportControllers.getAReportDetailsById);

module.exports = router;