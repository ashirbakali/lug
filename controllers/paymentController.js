const multer = require('multer');
const fs = require('fs');
const stripe_key = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || stripe_key);

const { User } = require('../model/user');
const { TravelRequest } = require('../model/TravelerRequest');
const { Payment } = require('../model/payment');
const { sendResponse } = require('../utils/sendResponse');
const { errorHandling } = require('../utils/errorhandling');
const { STATUS_CODES, STRIPE_ACCOUNT_STATUS } = require('../utils/constants');
const upload = require('../services/uploadImageService');

// Create Stripe Account controller
exports.createAccount = async (req, res) => {
    try {
        if (!req.user.travelerStripeId) {
            const account = await stripe.accounts.create({
                type: 'custom',
                country: req.body.address.country,
                email: req.user.email,
                business_type: 'individual',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true }
                },
            });

            await stripe.accounts.update(account?.id, {
                individual: {
                    first_name: req.body.firstname,
                    last_name: req.body.lastname,
                    email: req.user.email,
                    phone: req.body.phone,
                    ssn_last_4: req.body.ssn_last_4,
                    id_number: req.body.id_number,
                    address: {
                        line1: req.body.address.line1,
                        city: req.body.address.city,
                        state: req.body.address.state,
                        postal_code: req.body.address.postalcode,
                        country: req.body.address.country
                    },
                    dob: {
                        day: req.body.dob.day,
                        month: req.body.dob.month,
                        year: req.body.dob.year
                    }
                },
                tos_acceptance: {
                    date: account?.created,
                    ip: '0.0.0.0'
                },
                business_profile: {
                    support_phone: req.body.business_profile.support_phone,
                    support_url: process.env.BACKEND_URL,
                    url: process.env.BACKEND_URL,
                    mcc: '4829'
                },
                external_account: {
                    object: 'bank_account',
                    country: 'US',
                    currency: 'usd',
                    account_holder_name: req.user.fullname,
                    account_holder_type: 'individual',
                    routing_number: req.body.bankAccountDetails.routingNumber,
                    account_number: req.body.bankAccountDetails.accountNumber
                }
            });

            let status;
            if (account?.requirements.currently_due.length > 0) {
                status = STRIPE_ACCOUNT_STATUS.PENDING;
            } else {
                status = STRIPE_ACCOUNT_STATUS.COMPLETED;
            }

            await User.findByIdAndUpdate(req.user.id,
                {
                    travelerStripeId: account?.id,
                    travelerStripeStatus: status
                },
                { new: true }
            );

        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Already have a bank account"));
        }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Account created successfully"));
    } catch (error) {
        errorHandling(error, res);
    }
}

// verify image controller
exports.verifyImage = async (req, res) => {
    try {
        const uploadImage = upload.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]);
        uploadImage(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                try {
                    if (!req.files.front === undefined || req.files.front === "" || req.files.front === null)
                        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please Select Front Image"));
                    if (!req.files.back === undefined || req.files.back === "" || req.files.back === null)
                        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please Select Back Image"));
                    if (req.user.travelerStripeImageVerified) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Account already Verified"));

                    const fpFront = fs.readFileSync(req.files.front[0].path);
                    const fpBack = fs.readFileSync(req.files.back[0].path);
                    const uploadedFileFront = await stripe.files.create({
                        file: {
                            data: fpFront,
                            name: req.files.front.originalname,
                            type: 'application/octet-stream',
                        },
                        purpose: 'identity_document',
                    });
                    const uploadedFileBack = await stripe.files.create({
                        file: {
                            data: fpBack,
                            name: req.files.back.originalname,
                            type: 'application/octet-stream',
                        },
                        purpose: 'identity_document',
                    });

                    let account = await stripe.accounts.update(req.user.travelerStripeId, {
                        individual: {
                            verification: {
                                document: {
                                    front: uploadedFileFront?.id, // File ID from Stripe file upload for front of document
                                    back: uploadedFileBack?.id // File ID from Stripe file upload for back of document (if applicable)
                                }
                            }
                        }
                    });

                    let status;
                    if (account?.requirements.currently_due.length > 0) {
                        status = STRIPE_ACCOUNT_STATUS.PENDING;
                    } else {
                        status = STRIPE_ACCOUNT_STATUS.COMPLETED;
                    }

                    let user = await User.findByIdAndUpdate(req.user.id, { travelerStripeImageVerified: true, travelerStripeStatus: status }, { new: true });
                    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Image send for verification", user));

                } catch (error) {
                    errorHandling(error, res);
                }
            }
        });
    } catch (error) {
        errorHandling(error, res);
    }
}

// Get Stripe Card Details
exports.getCardDetails = async (req, res) => {
    try {
        // country default_currency account_holder_name bank_name last4
        let account;
        if (req.user.travelerStripeId) {
            account = await stripe.accounts.retrieve(req.user.travelerStripeId);
        } else {
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, "No Account Found"));
        }
        
        if (!account) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, "No Account Found"));
        let data = {
            country: account?.country,
            default_currency: account?.default_currency,
            account_holder_name: account?.external_accounts?.data[0]?.account_holder_name,
            bank_name: account?.external_accounts?.data[0]?.bank_name,
            last4: account?.external_accounts?.data[0]?.last4,
            status: account?.individual?.verification?.status
        }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Card & Account Details", data));
    } catch (error) {
        errorHandling(error, res);
    }
}

// Capture amount controller
exports.sendAmount = async (req, res) => {
    try {
        const { amount, currency, connectedAccountId } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency,
            capture_method: 'manual', // Hold the payment
            // payment_method_types: ["card"],
            transfer_data: {
                destination: connectedAccountId, // Specify the connected account
            },
        });

        // {
        //     success: true,
        //     paymentIntentId: paymentIntent.id,
        //     clientSecret: paymentIntent.client_secret, // Return this for the client-side confirmation
        // }
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Payment Successfully", paymentIntent?.client_secret));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Release Payment controller
exports.releasePayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        await stripe.paymentIntents.capture(paymentIntentId);

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Payment Release Successfully"));
    } catch (error) {
        errorHandling(error, res);
    }
}

// Get user account status from stripe acontroller
exports.getAccountStatus = async (req, res) => {
    try {
        if (!req.user.travelerStripeId) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'No Stripe account linked for this user'));

        const account = await stripe.accounts.retrieve(req.user.travelerStripeId);
        let status;
        if (account?.requirements.currently_due.length > 0) {
            status = STRIPE_ACCOUNT_STATUS.PENDING;
        } else {
            status = STRIPE_ACCOUNT_STATUS.COMPLETED;
        }

        let user = await User.findByIdAndUpdate(req.user.id,
            {
                travelerStripeStatus: status
            },
            { new: true }
        );
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, 'User Account Status', user));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Transfer amount to another user controller
exports.transferAmount = async (req, res) => {
    try {
        const { travelRequestId, amount } = req.body;
        let travelRequest = await TravelRequest.findById(travelRequestId);
        if (!travelRequest) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "Travel request not found"));
        if (travelRequest?.isPaid) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Amount is already Paid"));

        let bankDetails = {};
        const account = await stripe.accounts.retrieve(req.user.travelerStripeId);
        let user = await User.findById(travelRequest?.travelerId);
        const accountReciever = await stripe.accounts.retrieve(user?.travelerStripeId);

        bankDetails = {
            bankName: account?.external_accounts?.data[0]?.bank_name || 'N/A',
            last4: account?.external_accounts?.data[0]?.last4 || 'N/A',
            country: account?.external_accounts?.data[0]?.country || 'N/A',
            currency: account?.external_accounts?.data[0]?.currency || 'N/A',
            from_payment: `${req.user.fullname} Card Payment` || "N/A",
            to_payment:
                `${accountReciever?.external_accounts?.data[0]?.bank_name}` &&
                    `${accountReciever?.external_accounts?.data[0]?.bank_name}` !== undefined &&
                    `${accountReciever?.external_accounts?.data[0]?.bank_name}` !== "undefined" ?
                    `${accountReciever?.external_accounts?.data[0]?.bank_name}` : "No Bank Account"
        }

        await TravelRequest.findByIdAndUpdate(travelRequest?._id, { isPaid: true }, { new: true });
        await Payment.create({
            sender: req.user.id, reciever: travelRequest?.travelerId, amount, bankDetails,
            travel: travelRequest?.travelerpostId, travelRequest: travelRequestId
        });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Amount Paid Successfully"));

    } catch (e) {
        errorHandling(e, res);
    }
}

// Transfer to bank account
exports.transferToBank = async (req, res) => {
    try {
        if (!req.user.travelerStripeId) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'No Stripe account linked for this user'));

        // Check the available balance for the user's connected account
        const balance = await stripe.balance.retrieve({ stripeAccount: req.user.travelerStripeId });
        const instantAvailable = balance.instant_available.find(
            (item) => item.currency === 'usd'
        );

        if (!instantAvailable || instantAvailable?.amount === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'No instant available balance to transfer.'));

        let amount = req.body.amount ? (req.body.amount * 100) : instantAvailable?.amount;
        await stripe.payouts.create(
            {
                amount: amount,
                currency: instantAvailable?.currency,
                method: 'instant'
            },
            { stripeAccount: req.user.travelerStripeId }
        );

        let bankDetails = {};
        const account = await stripe.accounts.retrieve(req.user.travelerStripeId);

        bankDetails = {
            bankName: account?.external_accounts?.data[0]?.bank_name || 'N/A',
            last4: account?.external_accounts?.data[0]?.last4 || 'N/A',
            country: account?.external_accounts?.data[0]?.country || 'N/A',
            currency: account?.external_accounts?.data[0]?.currency || 'N/A',
            from_payment: `${req.user.fullname} Stripe Wallet` || "N/A",
            to_payment: account?.external_accounts?.data[0]?.bank_name || "N/A"
        }

        await Payment.create({
            sender: req.user.id, reciever: req.user.id, amount, bankDetails,
            travel: null, travelRequest: null
        });

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, 'Amount Transfer Successfully'));

    } catch (error) {
        if (error.type === 'StripeInvalidRequestError') {
            res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, 'Error: Insufficient funds or invalid request. Details:', error.message));
        } else {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(true, error.message));
        }
    }
};

// Get Wallet details controller
exports.getWalletDetails = async (req, res) => {
    try {
        if (!req.user.travelerStripeId) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, 'No Stripe account linked for this user'));
        let walletData = await Payment.find({ $or: [{ sender: req.user.id }, { reciever: req.user.id }] }).populate([
            { path: 'travel', select: 'fromdest todest' }
        ]);

        let payoutsWithBankDetails = [];
        for (const payout of walletData) {
            payoutsWithBankDetails.push({
                amount: (payout.amount / 100),
                currency: payout?.currency,
                status: payout?.sender.equals(payout?.reciever) ? "Debited" : "Credited",
                fromdest: payout?.travel !== null ? payout?.travel?.fromdest : "N/A",
                todest: payout?.travel !== null ? payout?.travel?.todest : "N/A",
                bankDetails: payout?.bankDetails ? {
                    // bankName: payout?.bankDetails.bank_name || 'N/A',
                    // last4: payout?.bankDetails.last4,
                    // country: payout?.bankDetails.country,
                    // currency: payout?.bankDetails.currency,
                    from_payment: payout?.bankDetails.from_payment,
                    to_payment: payout?.bankDetails.to_payment
                } : null
            });
        }

        const balance = await stripe.balance.retrieve({ stripeAccount: req.user.travelerStripeId });
        const formattedBalance = {
            available: balance.available.map((item) => ({
                amount: item.amount / 100,
                currency: item.currency,
                sourceTypes: item.source_types,
            })),
            instantAvailable: balance.instant_available.map((item) => ({
                amount: item.amount / 100,
                currency: item.currency,
                sourceTypes: item.source_types,
            })),
            pending: balance.pending.map((item) => ({
                amount: item.amount / 100,
                currency: item.currency,
                sourceTypes: item.source_types,
            })),
        };

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, 'Get Wallet Details', { paymentHistory: payoutsWithBankDetails, balance: formattedBalance }));

    } catch (error) {
        errorHandling(error, res);
    }
};

// get all payments for admin panel controller
exports.getAllPayments = async (req, res) => {
    try {
        const count = await Payment.find({ isDeleted: false }).countDocuments();
        const data = { count, results: res.paginatedResults }
        let message = res.paginatedResults ? "Get All Payments" : "No Payment Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        errorHandling(error, res);
    }
};

// get payment by id for admin panel controller
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate("sender reciever travel travelRequest");
        if (!payment) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, 'Payment not found'));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, 'Get Payment By ID', payment));

    } catch (error) {
        errorHandling(error, res);
    }
};