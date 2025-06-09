const router = require('express').Router();

const { middleWares } = require('../middlewares');
const { REVIEWS } = require('../utils/constants');
const { reviewsController } = require('../controllers');

// Add review
router.post(REVIEWS.ADD_REVIEW, middleWares.authenticateToken, middleWares.isAdmin, reviewsController.addReview);

// Get all reviews
router.get(REVIEWS.ALL_REVIEWS, middleWares.authenticateToken, reviewsController.getAllReviews);

// Delete review By id
router.post(`${REVIEWS.DELETE_REVIEW}/:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, reviewsController.deleteReview);

// Update review by id (admin only) route
router.put(`${REVIEWS.UPDATE_REVIEW}/:id`, middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, reviewsController.updateReview);

module.exports = router;