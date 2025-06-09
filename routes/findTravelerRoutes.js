const router = require('express').Router();

const { middleWares } = require('../middlewares');
const { TravelRequest } = require('../model/TravelerRequest');
const { findTravelerController } = require('../controllers');
const { FIND_TRAVEL_REQUEST } = require('../utils/constants');

// Get travels route
router.get("/gettravelers", middleWares.authenticateToken, findTravelerController.getTravellers);

// Get Travel for scrren route
router.get(FIND_TRAVEL_REQUEST.GET_TRAVEL_FOR_SCREEN, middleWares.authenticateToken, findTravelerController.getAllTravelsForScreen);

// Get travelers by filter route (radius)
router.get("/gettravelerbyradius", middleWares.authenticateToken, findTravelerController.gettravelersByRadius);

// send request route
router.post('/requesttraveler/:travelerid', middleWares.authenticateToken, findTravelerController.requestTraveler);

// Get All Traveler Request
router.get('/alltravelerrequests', middleWares.authenticateToken, findTravelerController.allTravelerRequest);

// All Luggaeg Request routes
router.get('/allluggagerequests', middleWares.authenticateToken, findTravelerController.allLuggageRequest);

// Accept/Reject Traveler Request route (the one who post the traveler)
router.post('/servicerequest/:id', middleWares.isValidObjectId, middleWares.authenticateToken, findTravelerController.serviceRequest);

// Get All traveler post for logged in user
router.get('/posttravel', middleWares.authenticateToken, findTravelerController.getTravelPosts);

// Get All traveler post By Id for logged in user
router.get('/posttravelbyid/:id', middleWares.authenticateToken, findTravelerController.getTravelPostById);

// Get all travel requests for admin route
router.get(FIND_TRAVEL_REQUEST.FIND_TRAVEL_REQUEST_ADMIN, middleWares.authenticateToken, middleWares.isAdmin, middleWares.paginatedResults(TravelRequest, "", false, "", ""), findTravelerController.travelRequestForAdmin);

// Get all travel requests for admin by id route
router.get(`${FIND_TRAVEL_REQUEST.FIND_TRAVEL_REQUEST_ADMIN}/:id`, middleWares.authenticateToken, middleWares.isAdmin, middleWares.isValidObjectId, findTravelerController.travelRequestForAdminById);

// Show requested packages (travel requests for calender) route
router.get(FIND_TRAVEL_REQUEST.SHOW_REQUESTED_PACKAGES, middleWares.authenticateToken, findTravelerController.calenderDataForTravelRequest);

module.exports = router;