const router = require("express").Router();

const { authControllers } = require("../controllers");
const { middleWares } = require("../middlewares");
const { AUTH_API_CONSTANTS } = require('../utils/constants')

// Resgiter User/player/admin Route
router.post("/register", authControllers.registerUser);

// Email Verify route
router.get("/:id/verify/:token/", authControllers.verifyEmail);

// Login User Route
router.post("/login", authControllers.loginUser);

// Logout User Route
router.post(AUTH_API_CONSTANTS.AUTH_LOGOUT, middleWares.authenticateToken, authControllers.logout);

// Connect With Google (Sign Up & Sign In) Route
router.post("/connectwithgoogle", authControllers.connectWithGoogle);

// Connect With Apple (Sign Up & Sign In) Route
router.post("/connectwithapple", authControllers.connectWithApple);

// Connect With Facebook (Sign Up & Sign In) Route
router.post('/connectwithfacebook', authControllers.connectWithFacebook);

module.exports = router;