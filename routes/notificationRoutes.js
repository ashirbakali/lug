const router = require('express').Router();

const { NOTIFICATION } = require('../utils/constants');
const { middleWares } = require('../middlewares');
const { notificationController } = require('../controllers');
const { Notification } = require('../model/notification');

// show all notification routes (all notif for specific user)
router.get('/shownotif', middleWares.authenticateToken, notificationController.showNotif);

// get notification by id controller (mark as read all well for that notification)
router.get('/notifbyid/:id', middleWares.isValidObjectId, middleWares.authenticateToken, notificationController.getNotifById);

// mark all notification as read route
router.post('/markasread', middleWares.authenticateToken, notificationController.markAsReadNotif);

// Get all notifications for admin panel
router.get(
    NOTIFICATION.NOTIFICATION_FOR_ADMIN, middleWares.authenticateToken, middleWares.isAdmin,
    notificationController.getAllNotifications
);

// get notification for admin panel by id
router.get(`${NOTIFICATION.NOTIFICATION_FOR_ADMIN}/:id`, middleWares.authenticateToken, middleWares.isAdmin, middleWares.isValidObjectId, notificationController.notificationByidForAdmin);

// send notification to all user by admin
router.post(NOTIFICATION.NOTIFICATION_FOR_USER_BY_ADMIN, middleWares.authenticateToken, middleWares.isAdmin, notificationController.sendNotificationByAdmin);

module.exports = router;