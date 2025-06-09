const router = require("express").Router();

const { User } = require("../model/user");
const { License } = require("../model/license");
const { middleWares } = require("../middlewares");
const { adminController } = require("../controllers");
const { AUTH_API_CONSTANTS, FLOW_API_CONSTANTS } = require('../utils/constants')

// Resgiter Admin Route
router.post(AUTH_API_CONSTANTS.AUTH_REGISTER, middleWares.authenticateToken, middleWares.isAdmin, adminController.registerAdmin);

// Login Admin Route
router.post(AUTH_API_CONSTANTS.AUTH_lOGIN, adminController.loginAdmin);

// Forget Password Admin Route
router.post(FLOW_API_CONSTANTS.FORGET_PASSWORD, adminController.forgetPasswordAdmin);

// Verify code Admin Route
router.post(FLOW_API_CONSTANTS.VERIFY_CODE, adminController.verifyCodeAdmin);

// Check if Session Expire for admin
router.post(FLOW_API_CONSTANTS.SESSION_EXPIRE, middleWares.authenticateToken, middleWares.isAdmin, adminController.sessionExpireAdmin);

// Confirm Password Admin Route
router.put(`${FLOW_API_CONSTANTS.CONFRIM_ADMIN_PASSWORD}/:id`, middleWares.isValidObjectId, adminController.confirmAdminPassword);

// View Admin Profile Route
router.get(FLOW_API_CONSTANTS.ADMIN_PROFILE, adminController.adminProfile);

// Update Admin Profile Route
router.patch(FLOW_API_CONSTANTS.UPDATE_ADMIN_PROFILE, middleWares.authenticateToken, middleWares.isAdmin, adminController.updateAdminController);

// Change Password Admin Route
router.put(FLOW_API_CONSTANTS.CHANGE_ADMIN_PASSWORD, middleWares.authenticateToken, middleWares.isAdmin, adminController.changeAdminPassword);

// View All Admin Route
router.get(FLOW_API_CONSTANTS.ALL_ADMIN, middleWares.authenticateToken, middleWares.isAdmin, middleWares.paginatedResults(User, "admin", false, "", ""), adminController.viewAllAdminsController);

// Get All Licenses
router.get(FLOW_API_CONSTANTS.GET_ALL_LICENSES, middleWares.paginatedResults(License, "", false, "", ""), middleWares.authenticateToken, middleWares.isAdmin, adminController.getAllLicenses);

// Get License By Id
router.get(`${FLOW_API_CONSTANTS.GET_LICENSE_BY_ID}/:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, adminController.getLicenseById);

// View Admin By ID Route
router.get(`${FLOW_API_CONSTANTS.ALL_ADMIN}:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, adminController.viewAdminById);

// De-Activate admin by super admin
router.post(`${FLOW_API_CONSTANTS.ADMIN_DEACTIVATE}/:id`,
    middleWares.authenticateToken, middleWares.isAdmin, middleWares.isValidObjectId, adminController.deactivateAdmin
);

// Verify user license by admin route
router.post(`${FLOW_API_CONSTANTS.VERIFY_LISENSE_BY_ADMIN}/:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, adminController.verifyUserLicense);

module.exports = router;