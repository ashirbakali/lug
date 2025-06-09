const router = require('express').Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const travelRoutes = require('./travelRoutes');
const findTravelerRoutes = require('./findTravelerRoutes')
const contactRoutes = require('./contactRoutes');
const notificationRoutes = require('./notificationRoutes');
const chatRoutes = require('./chatRoutes');
const messageRoutes = require('./messageRoutes');
const locationRoutes = require('./locationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');
const reviewsRoutes = require('./reviewsRoutes');
const paymentRoutes = require('./paymentRoutes');
const { AUTH_API_CONSTANTS, DASHBOARD_CONSTANT, NOTIFICATION, FLOW_API_CONSTANTS, REVIEWS } = require('../utils/constants')

// All Auth Routes
router.use('/auth', authRoutes);

// All User Routes
router.use('/user', userRoutes);

// All User Routes
router.use(AUTH_API_CONSTANTS.ADMIN, adminRoutes);

// All Travel post routes
router.use('/travel', travelRoutes);

// All Find Traveler routes
router.use('/findtraveler', findTravelerRoutes);

// All Contact Routes
router.use('/contact', contactRoutes);

// All notification routes
router.use(NOTIFICATION.NOTIFICATION, notificationRoutes);

// All Location routes
router.use('/location', locationRoutes)

// All Chat routes
router.use('/chat', chatRoutes);

// All Message routes
router.use('/message', messageRoutes);

// All dashDatabase routes
router.use(DASHBOARD_CONSTANT.DASHBOARD, dashboardRoutes);

// All Report routes
router.use(FLOW_API_CONSTANTS.REPORT, reportRoutes);

// All Reviews routes
router.use(REVIEWS.REVIEW, reviewsRoutes);

// All Payment routes
router.use("/payment", paymentRoutes);

module.exports = router;