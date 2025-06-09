const router = require('express').Router();

const { Travel } = require('../model/travel');
const { middleWares } = require('../middlewares');
const { postTravelController } = require('../controllers');
const { POST_TRAVEL } = require('../utils/constants')

// Post A travel route
router.post('/posttravel', middleWares.authenticateToken, postTravelController.travelPost);

// Delivered a Service with traveler id route
router.post('/deliverservice/:id', middleWares.isValidObjectId, middleWares.authenticateToken, postTravelController.deliverService);

// Add Reviews route
router.post('/addreviews/:id', middleWares.isValidObjectId, middleWares.authenticateToken, postTravelController.addReviews);

// Total Travel Posts for admin
router.get(POST_TRAVEL.POST_TRAVEL_ADMIN, middleWares.authenticateToken, middleWares.isAdmin, middleWares.paginatedResults(Travel, "", false, "userId", ""), postTravelController.allTravelPosts);

// Travel Posts for admin by Id
router.get(`${POST_TRAVEL.POST_TRAVEL_ADMIN}/:id`, middleWares.authenticateToken, middleWares.isAdmin, middleWares.isValidObjectId, postTravelController.TravelPostByIdForAdmin);

module.exports = router;