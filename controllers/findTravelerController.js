const geolib = require('geolib');
const multer = require('multer');
const mongoose = require('mongoose');

const { TravelRequest } = require('../model/TravelerRequest');
const { Notification } = require('../model/notification');
const { Travel } = require("../model/travel");
const { User } = require('../model/user');
const { sendResponse } = require("../utils/sendResponse");
const { isEmpty } = require('../utils/isEmpty');
const { logger } = require('../utils/logger');
const { paginate } = require('../services/paginateService');
const { errorHandling } = require('../utils/errorhandling');
const { sendNotification } = require('../services/fcmTokenService');
const { STATUS_CODES, FIELDS, SERVICES, NOTIF_REDIRECT } = require('../utils/constants');
const { startJob, stopJob } = require('../cronjobs/sendNotifForTravelRequest');
const upload = require('../services/uploadImageService').array("lugImages");
const { asyncHandler } = require('../middlewares/asyncHandler');

//get travellers by city controller
// exclude those travelers (travel post) that are by logged in user
exports.getTravellers = asyncHandler(async (req, res) => {
    if (!req.body.todest) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Destination Required"));

    const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }
    let fromdest = req.body.fromdest ? req.body.fromdest : req.user.city,
        totalWeight = req.body.totalWeight ? req.body.totalWeight : 15,
        weightUnit = req.body.weightUnit ? req.body.weightUnit : 'lbs';

    const options = {
        userId: { $ne: req.user.id }, fromdest: fromdest, todest: req.body.todest,
        totalWeight: { $gte: totalWeight }, weightUnit: weightUnit
    }

    const populateOptions = [{ path: 'userId', select: '-password -confirmPassword' }];
    const results = await paginate(Travel, query, options, populateOptions);
    if (results?.totalResults === 0) return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Ops! No Travel Post Found"));

    res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Travel Posts with searched places", results));
});

// get all traverls to show on screen controller
// exports.getAllTravelsForScreen = async (req, res) => {
//     try {
//         const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }
//         const options = { userId: { $ne: req.user.id } }
//         const populateOptions = [{ path: 'userId', select: "-chatFriends -createdAt -updatedAt" }];

//         const results = await paginate(Travel, query, options, populateOptions);
//         if (results?.length === 0) return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Ops! No Travel Found", results));
//         res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Travellers with searched places", results));

//     } catch (error) {
//         errorHandling(error, res);
//     }
// }


exports.getAllTravelsForScreen = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const options = { userId: { $ne: req.user.id }, isDeleted: false };
        const populateOptions = [
            {
                path: 'userId',
                select: "-chatFriends -createdAt -updatedAt"
            },
            {
                path: 'requestToTravelerId',
                select: 'userId'
            }
        ];

        // ✅ Correct destructuring here
        const { results, totalResults } = await paginate(Travel, { limit }, options, populateOptions);

        const enhancedResults = results.map(travel => {
            const applied = travel.requestToTravelerId.some(reqDoc =>
                reqDoc.userId?.toString() === req.user.id.toString()
            );

            const travelObj = travel.toObject();
            delete travelObj.requestToTravelerId;

            return {
                ...travelObj,
                isApplied: applied
            };
        });

        if (enhancedResults.length === 0) {
            return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Ops! No Travel Found", enhancedResults));
        }

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Travellers with searched places", {
            results: enhancedResults,
            totalResults
        }));

    } catch (error) {
        errorHandling(error, res);
    }
};








// Filter Travelers by radius controller


exports.gettravelersByRadius = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
        let options = { userId: { $ne: req.user.id } };

        // Existing conditions
        if (req.body.weightUnit) { options.weightUnit = req.body.weightUnit; }
        if (req.body.fromdest) { options.fromdest = req.body.fromdest; }
        if (req.body.todest) { options.todest = req.body.todest; }
        if (req.body.totalWeight) { options.totalWeight = { $gte: req.body.totalWeight }; }
        if (req.body.departureDate) { options.departureDate = new Date(req.body.departureDate); }

        const populateOptions = [{ path: 'userId', select: '-password -confirmPassword' }];
        let query = Travel.find(options);

        // Apply population options if provided
        const sort = { _id: -1 };
        if (populateOptions) { query = query.populate(populateOptions); }

        const results = await query.sort(sort).limit(limit).exec();
        const total = await Travel.countDocuments(options).exec();

        if (results?.totalResults === 0) {
            return res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Ops! No Travel Found", results));
        }

        // let getTraveler = [], message;

        // for (var i = 0; i < results?.results.length; i++) {
        //     if (req.body.radius) {
        //         if (geolib.isPointWithinRadius(
        //             { latitude: req.user.latitude, longitude: req.user.longitude },
        //             { latitude: results.results[i].userId.latitude, longitude: results.results[i].userId.longitude },
        //             req.body.radius
        //         )) {
        //             getTraveler.push(results.results[i]);
        //             message = "Get Travelers";
        //         } else {
        //             message = "Ops! No Travel Found Please Extend your search";
        //         }
        //     } else {
        //         getTraveler.push(results.results[i]);
        //         message = "Get Travelers";
        //     }
        // }

        const data = { results: results, totalResults: total };
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Get Travelers", data));

    } catch (error) {
        errorHandling(error, res);
    }
}

// Traveler Request Controller
exports.requestTraveler = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));

                const { travelerid } = req.params;
                const traveler = await Travel.findOne({ _id: travelerid }).populate("requestToTravelerId", "userId");

                for (let i = 0; i < traveler?.requestToTravelerId?.length; i++) {
                    if (traveler?.requestToTravelerId[i]?.userId[0]?.toString() === req.user?._id.toString()) {
                        return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "You have already requested this traveler"));
                    }
                }
                if (traveler.totalWeight < req.body.lugweight) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Number must be on available weight"));
                // change url according to project
                let url = process.env.BACKEND_URL || "https://lug.testdevlink.net/", images = [];
                if (req.files.length === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please select atleast one image"));
                if (req.files.length > 6) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Please select no more than 6 images"));

                for (var i = 0; i < req.files.length; i++) {
                    images[i] = {
                        imageName: req.files[i].originalname,
                        imageUrl: `${url}uploads/${req.files[i].filename}`,
                        imageSize: req.files[i].size > 1000000 ? `${(req.files[i].size / 1048576).toFixed(2)} MB` : `${(req.files[i].size / 1024).toFixed(2)} KB`
                    }
                }
                // user who post the travel
                let TravelerUser = await User.findById(traveler.userId);

                // get data from previous screen (if user don't update parameters)
                let addData = {
                    travelerId: traveler.userId,
                    travelerpostId: traveler.id,
                    userId: req.user.id,
                    fullname: req.body.fullname ? req.body.fullname : req.user.fullname,
                    email: req.body.email ? req.body.email : req.user.email,
                    fromdest: req.body.fromdest ? req.body.fromdest : traveler.fromdest,
                    todest: req.body.todest ? req.body.todest : traveler.todest,
                    lugweight: req.body.lugweight,
                    weightUnit: req.body.weightUnit,
                    notes: req.body.notes,
                    images: images
                }

                const requestedUserMsg = `${req.user.fullname} has sent you the traveler request`;
                const travelerRequest = await TravelRequest.create(addData);
                // create traveler request and notification
                await Notification.create({
                    userId: traveler.userId, travelerId: req.user.id, travelerpostId: traveler.id, travelRequestId: travelerRequest?.id,
                    details: requestedUserMsg, NotifRedirect: NOTIF_REDIRECT.TRAVEL_REQUEST
                });
                sendNotification(TravelerUser.fcmToken, "Request Traveler", requestedUserMsg);
                await Travel.findByIdAndUpdate(
                    traveler.id,
                    { $push: { requestToTravelerId: travelerRequest?.id } }, { new: true }
                );
                stopJob();
                startJob();

                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Request has been successfully send", travelerRequest));
            }
        });

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// All requests for traveler controller (logged In user recieved travel request)
exports.allTravelerRequest = async (req, res) => {
    try {
        const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }
        const options = { travelerId: req.user.id }
        const populateOptions = [
            { path: 'userId', select: '-password -confirmPassword' },
            { path: 'travelerId', select: '-password -confirmPassword' },
            { path: 'travelerpostId', select: '-createdAt -updatedAt' }
        ]
        const results = await paginate(TravelRequest, query, options, populateOptions);

        if (results.length === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No traveler request found"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Traveler Requests", results));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// All Luggage Request controller (logged in user request travel)
exports.allLuggageRequest = async (req, res) => {
    try {
        const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }

        const options = { userId: req.user?.id }
        const populateOptions = [
            { path: 'userId', select: '-password -confirmPassword' },
            { path: 'travelerId', select: '-password -confirmPassword' },
            { path: 'travelerpostId', select: '-createdAt -updatedAt' }
        ]
        const results = await paginate(TravelRequest, query, options, populateOptions);

        if (results.length === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No Luggage request found"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Luggage Request", results));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Accept/Reject Traveler Request Controller (the one who post the traveler)
exports.serviceRequest = async (req, res) => {
    const session = await mongoose.startSession(); // Start a MongoDB session for transactions
    session.startTransaction();

    try {

        let travelerReq = await TravelRequest.findById(req.params.id),
            letTraveler = await Travel.findById(travelerReq?.travelerpostId).populate([
                { path: 'requestToTravelerId', select: 'userId service', populate: { path: 'userId', select: 'fcmToken' } }
            ]).session(session),
            TravelerUser = await User.findById(travelerReq?.userId);

        if (!letTraveler) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No Travel Post Found"));
        if (letTraveler.userId.toString() !== req.user._id.toString()) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "You are not the Traveler of this Post"));
        if (letTraveler.service === SERVICES.ACCEPT || letTraveler.service === SERVICES.REJECT)
            return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, `Already ${letTraveler.service} Traveler Request`));

        let message;
        if (req.body.service === SERVICES.ACCEPT) {
            if (letTraveler?.remainingWeight < travelerReq?.lugweight) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No More Space Available in Your Travel Post"));

            // Perform an atomic operation to ensure no race condition occurs
            const updatedTraveler = await Travel.findOneAndUpdate(
                { _id: letTraveler.id, remainingWeight: { $gte: travelerReq?.lugweight } }, // Ensure enough weight is available
                { $inc: { remainingWeight: -travelerReq?.lugweight } }, // Deduct the requested weight
                { new: true, session } // Use session for the transaction
            );

            if (!updatedTraveler) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No More Space Available in Your Travel Post"));

            // letTraveler = await Travel.findByIdAndUpdate(letTraveler.id, { remainingWeight: letTraveler.remainingWeight - travelerReq.lugweight }, { new: true });
            travelerReq = await TravelRequest.findByIdAndUpdate(req.params.id, { service: req.body.service }, { new: true, session });
            message = "You have successfully accepted this request";
        } else {
            travelerReq = await TravelRequest.findByIdAndUpdate(req.params.id, { service: req.body.service, status: SERVICES.NOT_SELECTED_BY_TRAVELER }, { new: true, session });
            message = "You have successfully rejected this request";
        }

        // send notification to those who're still at pending requests
        if (letTraveler?.remainingWeight === 0) {
            for (let i = 0; i < letTraveler?.requestToTravelerId?.length; i++) {
                if (letTraveler?.requestToTravelerId[i]?.service === SERVICES.IDLE) {
                    sendNotification(letTraveler?.requestToTravelerId[i]?.userId[0]?.fcmToken, "Lug Travel Request", "The Travel Request is currently Full, please apply other travel posts");
                }
            }
        }

        let requestedUserMsg = `${req.user.fullname} ${req.body.service} your traveler request`;
        await Notification.create([{
            userId: travelerReq?.userId, travelerId: req.user.id, travelerpostId: letTraveler?.id,
            details: requestedUserMsg, NotifRedirect: NOTIF_REDIRECT.LUGGAGE_REQUEST
        }], { session });
        sendNotification(TravelerUser.fcmToken, "Request Traveler", requestedUserMsg, travelerReq?.images[0]?.imageUrl);
        await session.commitTransaction(); // Commit the transaction
        session.endSession();

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, travelerReq));

    } catch (error) {
        await session.abortTransaction(); // Rollback the transaction in case of error
        session.endSession();
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get All traveler post for logged in user
exports.getTravelPosts = async (req, res) => {
    try {
        const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }
        const options = { userId: req.user.id }
        const populateOptions = [{ path: 'userId', select: 'fullname email profile' }]

        const results = await paginate(Travel, query, options, populateOptions);
        if (results.length === 0) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "No Travel Post found"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Travel Post For Logged In User", results));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get All traveler post by Id for logged in user
exports.getTravelPostById = async (req, res) => {
    try {
        const populateOptions = [
            { path: 'userId', select: '-chatFriends' },
            { path: 'requestToTravelerId' },
            { path: 'requestToTravelerId', populate: 'travelerId userId travelerpostId' }
        ]
        let getTravelPostById = await Travel.findById(req.params.id).populate(populateOptions);
        if (getTravelPostById.userId._id.toString() !== req.user._id.toString()) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, "Not Your Travel Post"));

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Travel Post For By Id Logged In User", getTravelPostById));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get all travel requests for admin Controller
exports.travelRequestForAdmin = async (req, res) => {
    try {
        const count = await TravelRequest.find().countDocuments();
        const data = { count: count, results: res.paginatedResults }
        let message = res.paginatedResults ? "All Travel Post For Admin" : "No Travel Posts Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// Get all travel requests for admin Controller
exports.travelRequestForAdminById = async (req, res) => {
    try {
        const requests = await TravelRequest.findById(req.params.id).populate("travelerId travelerpostId userId");
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Travel Request", requests));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// for clander (show data of travel for travel request)
exports.calenderDataForTravelRequest = async (req, res) => {
    try {
        // Find travel requests with "Accept" service for the current user and populate the related fields
        const request = await TravelRequest.find({ service: "Accept", userId: { $in: req.user.id } })
            .populate("travelerpostId", "bookingDate departureDate arrivalDate")
            .sort({ "travelerpostId.departureDate": 1, "travelerpostId.arrivalDate": 1 }); // Sorting by departureDate and arrivalDate

        // Send the sorted travel requests as the response
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Your Package Request", request));

    } catch (error) {
        errorHandling(error, res);
    }
}