const router = require('express').Router();

const { FLOW_API_CONSTANTS } = require('../utils/constants');
const { middleWares } = require('../middlewares');
const { userController } = require('../controllers');
const { User } = require('../model/user');

//Forget Password Route 
router.post('/forgetpassword', userController.forgetPassword);

// Verify code route
router.post('/verifycode', userController.verifyCode);

//Create New Password for the user 
router.put('/confirmpassword/:id', middleWares.isValidObjectId, userController.confirmPassword);

// CHnage passowrd route for logged in user
router.put('/changepassword', middleWares.authenticateToken, userController.changePassword);

// View logged in user profile route
router.get('/getuserprofile', middleWares.authenticateToken, userController.userProfile);

// Update user profile route
router.put('/updateuserprofile', middleWares.authenticateToken, userController.updateUserProfile);

// delete user route
router.post('/deleteuser', middleWares.authenticateToken, userController.delUser);

// 
router.get('/licensestatus', middleWares.authenticateToken, userController.getMessageAndStatus);

// refresh token route
router.post(FLOW_API_CONSTANTS.SESSION_EXPIRE, middleWares.authenticateToken, userController.sessionExpire);

// add long & lat while user hit home screen route
router.put(FLOW_API_CONSTANTS.SET_LONG_LAT, middleWares.authenticateToken, userController.setLongLat);

// Search User for admin panel
router.get('/searchuser', middleWares.authenticateToken, userController.searchUser);

// Get all messages for specified user
router.get(FLOW_API_CONSTANTS.GET_ALL_MESSAGES, middleWares.authenticateToken, middleWares.isAdmin, userController.getUserChat);

// De-Activate user by admin
router.post(`${FLOW_API_CONSTANTS.BLOCKED_USER_BY_ADMIN}/:id`, middleWares.authenticateToken, middleWares.isAdmin, userController.blockedUserByAdmin);

// user with most no of travels controller for admin panel
router.get(`${FLOW_API_CONSTANTS.MOST_NO_OF_TRAVEL_BY_USER}`, middleWares.authenticateToken, middleWares.isAdmin, userController.mostNoOfTravelsByUsers);

// Get All User Routes
router.get(FLOW_API_CONSTANTS.ALL_USER, middleWares.paginatedResults(User, "user", false), middleWares.authenticateToken, middleWares.isAdmin, userController.getAllUsers);

// Get User By ID controller for admin panel
router.get(`${FLOW_API_CONSTANTS.ALL_USER}:id`, middleWares.authenticateToken, middleWares.isAdmin, userController.getUserByID);

// Verify License route
router.post(FLOW_API_CONSTANTS.VERIFY_LISENSE, middleWares.authenticateToken, userController.verifyLicense);

module.exports = router;