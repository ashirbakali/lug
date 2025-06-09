const multer = require('multer');

const { Notification } = require('../model/notification');
const { paginate } = require('../services/paginateService');
const { sendNotificationMultiple } = require('../services/fcmTokenService');
const { sendResponse } = require('../utils/sendResponse');
const { STATUS_CODES, FIELDS, ROLES } = require('../utils/constants');
const { isEmpty } = require('../utils/isEmpty');
const { logger } = require('../utils/logger');
const { User } = require('../model/user');
const upload = require('../services/uploadImageService').single("image");

// show notifications for logged in user controller
exports.showNotif = async (req, res) => {
    try {
        const query = { limit: parseInt(req.query.limit) ? parseInt(req.query.limit) : 10 }
        const options = { userId: req.user.id, isAdmin: false }
        const populateOptions = [
            { path: 'userId', select: '-password -confirmPassword' },
            { path: 'travelerId', select: '-password -confirmPassword' },
            { path: 'travelerpostId', select: '-createdAt -updatedAt' }
        ]

        const results = await paginate(Notification, query, options, populateOptions);

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "All Notification", results));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// get notification by id controller (mark as read for that notification)
exports.getNotifById = async (req, res) => {
    try {
        let allNotif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
            .populate("userId", "-password -confirmPassword")
            .populate("travelerId", "-password -confirmPassword")
            .populate("travelerpostId", "-createdAt -updatedAt");

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Notification By ID", allNotif));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// mark all notification as read controller
exports.markAsReadNotif = async (req, res) => {
    try {
        const updateNotifications = async (ids, index = 0, updatedNotifications = []) => {
            if (index < ids.length) {
                const notification = await Notification.findByIdAndUpdate(ids[index], { read: true }, { new: true })
                    .populate("userId", "-password -confirmPassword")
                    .populate("travelerId", "-password -confirmPassword")
                    .populate("travelerpostId", "-createdAt -updatedAt");
                updatedNotifications.push(notification);
                return updateNotifications(ids, index + 1, updatedNotifications);
            } else {
                return updatedNotifications;
            }
        }

        const updatedNotifications = await updateNotifications(req.body.ids);
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Mark as read", updatedNotifications));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// All Notification for admin controller
exports.getAllNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const notif = await Notification.find({ isAdmin: true }).populate([
            { path: 'userId', select: '-password -confirmPassword' },
            { path: 'travelerId', select: '-password -confirmPassword' },
            { path: 'travelerpostId', select: '-createdAt -updatedAt' }
        ]).sort({ _id: -1 }).limit(limit).skip(page).exec();

        const data = { count: notif?.length, results: notif }
        let message = notif?.length > 0 ? "Get All Notification" : "No Notification Found";

        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, message, data));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// notification by id controller for admin
exports.notificationByidForAdmin = async (req, res) => {
    try {
        let getNotif = await Notification.findById(req.params.id).populate("userId travelerId travelerpostId");
        getNotif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
        res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Notification By ID For Admin", getNotif));

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}

// send notification to all user by admin
exports.sendNotificationByAdmin = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else if (err instanceof multer.MulterError) {
                res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, err));
            } else {
                if (!isEmpty(req.body)) return res.status(STATUS_CODES.BAD_REQUEST).send(sendResponse(false, FIELDS.FILL_ALL_FIELDS));
                let url = process.env.BACKEND_URL || "https://lug.testdevlink.net/", image;

                let users = await User.find().select("fcmToken");
                let fcmToken = [];
                for (let i = 0; i < users.length; i++) { fcmToken.push(users[i].fcmToken) }
                image = req.file ? `${url}${req.file?.filename}` : '';

                await Notification.create({ userId: req.user.id, travelerId: req.user.id, travelerpostId: req.user.id, isAdmin: true, details: req.body.body });
                sendNotificationMultiple(fcmToken, req.body.title, req.body.body, image);
                res.status(STATUS_CODES.SUCCESS).send(sendResponse(true, "Send Notification to all user successfully"));
            }
        });

    } catch (error) {
        logger.error(error.message);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(sendResponse(false, error.message));
    }
}