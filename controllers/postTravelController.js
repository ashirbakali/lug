const multer = require('multer');
const stripe_key = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || stripe_key);

const { User } = require('../model/user');
const { Travel } = require("../model/travel");
const { Notification } = require('../model/notification');
const { TravelRequest } = require('../model/TravelerRequest');
const { sendResponse } = require("../utils/sendResponse");
const { logger } = require('../utils/logger');
const { STATUS_CODES, SERVICES, NOTIF_REDIRECT } = require('../utils/constants');
const { sendNotification } = require('../services/fcmTokenService');
const upload = require('../services/uploadImageService').array('lugimages');

//create a travel post controller
exports.travelPost = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(STATUS_CODES.NOT_FOUND).send(sendResponse(false, "User not found"));
        if (!user?.isLicenseVerified) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Your license is not Verified, please contact the administrator"));
        const account = await stripe.accounts.retrieve(user?.travelerStripeId);
        if (account?.individual?.verification?.status === "unverified") return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(true, "Your Account is not Verified, please Verify Your Account"));

        const createdTravel = await Travel.create({ userId: req.user.id, fullname: user.fullname, age: user.age, remainingWeight: req.body.totalWeight, ...req.body });
        res.status(STATUS_CODES.CREATED).send(sendResponse(true, "Your Travel has been Created", createdTravel));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Delivered the service controller (end job for travel requests)
exports.deliverService = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                const images = [];
                if (req.files?.length === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please select atleast one image"));
                else if (req.files?.length > 3) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No More than 3 images are allowed"));

                const url = process.env.BACKEND_URL || "https://lug.testdevlink.net/";
                for (var i = 0; i < req.files?.length; i++) {
                    images[i] = {
                        imageName: req.files[i].originalname,
                        imageUrl: `${url}uploads/${req.files[i].filename}`,
                        imageSize: req.files[i].size > 1000000 ? `${(req.files[i].size / 1048576).toFixed(2)} MB` : `${(req.files[i].size / 1024).toFixed(2)} KB`
                    }
                }

                let travelReq = await TravelRequest.findById(req.params.id).populate("userId");
                let findPost = await Travel.findById(travelReq?.travelerpostId).populate("requestToTravelerId");
                for (let i = 0; i < findPost?.requestToTravelerId?.length; i++) {
                    if (findPost?.requestToTravelerId[i]?.service === SERVICES.IDLE) {
                        await TravelRequest.findByIdAndUpdate(findPost?.requestToTravelerId[i]?._id, { service: SERVICES.NOT_SELECTED_BY_TRAVELER, status: SERVICES.NOT_SELECTED_BY_TRAVELER }, { new: true });
                    }
                }
                const addData = { images: images, message: req.body.message, status: "Delivered" }
                travelReq = await TravelRequest.findByIdAndUpdate(req.params.id, addData, { new: true });
                let message = "Your Package has been Delivered, wanna rate traveler";

                await Notification.create({
                    userId: travelReq?.userId[0]._id, travelerId: findPost?.userId?._id, travelerpostId: findPost.id, travelRequestId: travelReq?.id,
                    details: message, NotifRedirect: NOTIF_REDIRECT.REVIEW_TRAVELER
                });
                sendNotification(travelReq.userId[0]?.fcmToken, "Luggage Delivered", message, images[0].imageUrl);

                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "You have successfully completed your job", findPost));
            }

        });

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// add reviews controller
exports.addReviews = async (req, res) => {
    try {
        // add reviews by logged In user (logged in user rate traveler)
        const reviewmodel = {
            name: req.user.fullname,
            userid: req.user.id,
            rating: Number(req.body.rating),
            message: req.body.review
        }

        // find the traveler
        let travelerUser = await User.findById(req.params.id);
        travelerUser?.reviews.push(reviewmodel);

        // lets adjust traveler reviews (update new reviews & rating) (add another review to the traveler)
        var rating = travelerUser.reviews.reduce((acc, x) => acc + x.rating, 0) / travelerUser?.reviews?.length;
        travelerUser.rating = rating;
        await travelerUser.save();

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Review Added Successfully"));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get All traveler post for Admin
exports.allTravelPosts = async (req, res) => {
    try {
        const count = await Travel.find().countDocuments();
        const data = { count: count, results: res.paginatedResults }
        let message = res.paginatedResults ? "All Travel Post For Admin" : "No Travel Posts Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get All traveler post by Id for logged in user
exports.TravelPostByIdForAdmin = async (req, res) => {
    try {
        const populateOptions = [
            { path: 'userId', select: 'fullname email phoneNumber age city profile rating reviews' },
            { path: 'requestToTravelerId' },
            {
                path: 'requestToTravelerId', populate: [
                    { path: 'travelerpostId', select: 'fromdest todest totalWeight remainingWeight weightUnit costPerKg costUnit notes status service images' },
                    { path: 'userId', select: 'phoneNumber city profile' }
                ]
            }
        ]
        let getTravelPostById = await Travel.findById(req.params.id).populate(populateOptions).select('userId requestToTravelerId');

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Travel Post For By Id Logged In User", getTravelPostById));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}