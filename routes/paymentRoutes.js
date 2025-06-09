const router = require('express').Router();

const { Payment } = require('../model/payment');
const { middleWares } = require('../middlewares');
const { paymentController } = require('../controllers')

// Create payment
router.post('/transferamount', middleWares.authenticateToken, paymentController.transferAmount);

// Verify image
router.post('/verifyimage', middleWares.authenticateToken, paymentController.verifyImage);

// Get user stripe account status
router.get('/getaccountstatus', middleWares.authenticateToken, paymentController.getAccountStatus);

// Capture amount route
router.post('/sendmoney', middleWares.authenticateToken, paymentController.sendAmount);

// Payment Release route
router.post('/releasepayment', middleWares.authenticateToken, paymentController.releasePayment);

// Get Card Details
router.get('/getcarddetails', middleWares.authenticateToken, paymentController.getCardDetails);

// Create Stripe account route
router.post('/createaccount', middleWares.authenticateToken, paymentController.createAccount);

// Transfer money to own bank account
router.post('/transfertobank', middleWares.authenticateToken, paymentController.transferToBank);

// Get Wallet Details route
router.get('/walletdetails', middleWares.authenticateToken, paymentController.getWalletDetails);

// Get all payments for admin panel controller
router.get('/getpayments', middleWares.authenticateToken, middleWares.isAdmin,
    middleWares.paginatedResults(Payment, "", false, "sender reciever travel", "fullname email profile fromdest todest"),
    middleWares.isAdmin, paymentController.getAllPayments);

// Get all payments for admin panel controller by id
router.get('/getpayments/:id', middleWares.isValidObjectId, middleWares.authenticateToken, middleWares.isAdmin, paymentController.getPaymentById);

module.exports = router;