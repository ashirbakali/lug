const { registerUser, verifyEmail, loginUser, logout, connectWithApple, connectWithGoogle, connectWithFacebook } = require('./authControllers');
const {
    confirmPassword, verifyCode, forgetPassword, changePassword, getUserChat,
    userProfile, updateUserProfile, delUser, setLongLat, getAllUsers, verifyLicense,
    getUserByID, sessionExpire, mostNoOfTravelsByUsers, blockedUserByAdmin, searchUser, getMessageAndStatus
} = require('./userController');
const {
    registerAdmin, loginAdmin, forgetPasswordAdmin, verifyUserLicense,
    verifyCodeAdmin, adminProfile, confirmAdminPassword,
    changeAdminPassword, viewAllAdminsController, viewAdminById,
    updateAdminController, deactivateAdmin, sessionExpireAdmin, getAllLicenses, getLicenseById
} = require('./adminController');
const { travelPost, deliverService, addReviews, allTravelPosts, TravelPostByIdForAdmin } = require('./postTravelController');
const {
    getTravellers, gettravelersByRadius, requestTraveler, getAllTravelsForScreen,
    allTravelerRequest, allLuggageRequest, serviceRequest, calenderDataForTravelRequest,
    getTravelPosts, getTravelPostById, travelRequestForAdmin, travelRequestForAdminById
} = require('./findTravelerController');
const { contactPost } = require('./contactController');
const { showNotif, getNotifById, markAsReadNotif, getAllNotifications, notificationByidForAdmin, sendNotificationByAdmin } = require('./notificationController');
const { filterLocation, addCities } = require('./locationController');
const { accessChat, fetchChat } = require('./chatControllers');
const { sendMessage, allMessages } = require('./messageControllers');
const { reportUser, getAllReports, getAReportDetailsById } = require('./reportControllers');
const { dashData } = require('./dashboardController');
const { addReview, getAllReviews, deleteReview, updateReview } = require('./reviewsController');
const { transferAmount, createAccount, getAccountStatus, sendAmount, releasePayment, getCardDetails, verifyImage, transferToBank, getWalletDetails, getAllPayments, getPaymentById } = require('./paymentController');

// All Auth Controllers
exports.authControllers = {
    registerUser,
    verifyEmail,
    loginUser,
    logout,
    connectWithApple,
    connectWithGoogle,
    connectWithFacebook
}

// All User Controllers
exports.userController = {
    forgetPassword,
    verifyCode,
    confirmPassword,
    changePassword,
    userProfile,
    updateUserProfile,
    delUser,
    setLongLat,
    getAllUsers,
    getUserByID,
    getUserChat,
    sessionExpire,
    mostNoOfTravelsByUsers,
    blockedUserByAdmin,
    searchUser,
    reportUser,
    verifyLicense,
    getMessageAndStatus
}

// All Admin Controllers
exports.adminController = {
    registerAdmin,
    loginAdmin,
    forgetPasswordAdmin,
    verifyCodeAdmin,
    adminProfile,
    confirmAdminPassword,
    changeAdminPassword,
    viewAllAdminsController,
    viewAdminById,
    updateAdminController,
    deactivateAdmin,
    sessionExpireAdmin,
    verifyUserLicense,
    getAllLicenses,
    getLicenseById
}

//All Travel Controllers 
exports.postTravelController = {
    travelPost,
    deliverService,
    addReviews,
    allTravelPosts,
    TravelPostByIdForAdmin
}

// All find traveler routes
exports.findTravelerController = {
    getTravellers,
    gettravelersByRadius,
    requestTraveler,
    allTravelerRequest,
    allLuggageRequest,
    serviceRequest,
    getTravelPosts,
    getTravelPostById,
    travelRequestForAdmin,
    travelRequestForAdminById,
    calenderDataForTravelRequest,
    getAllTravelsForScreen
}

//All Travel Controllers 
exports.contactController = {
    contactPost
}

// All Notifcation controllers
exports.notificationController = {
    showNotif,
    getNotifById,
    markAsReadNotif,
    getAllNotifications,
    notificationByidForAdmin,
    sendNotificationByAdmin
}

// All Location Controller
exports.locationController = {
    addCities,
    filterLocation
}

// All Chat Controllers
exports.chatControllers = {
    accessChat,
    fetchChat
}

// All Message Controllers
exports.messageControllers = {
    sendMessage,
    allMessages
}

// All Report Controllers
exports.reportControllers = {
    reportUser,
    getAllReports,
    getAReportDetailsById
}

// All Dashboard Controllers
exports.dashboardController = {
    dashData
}

// All Add Review Controllers
exports.reviewsController = {
    addReview,
    getAllReviews,
    deleteReview,
    updateReview
}

// All Payment Controllers
exports.paymentController = {
    transferAmount,
    createAccount,
    getAccountStatus,
    sendAmount,
    releasePayment,
    getCardDetails,
    verifyImage,
    transferToBank,
    getWalletDetails,
    getAllPayments,
    getPaymentById
}