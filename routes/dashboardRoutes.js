const router = require('express').Router();

const { middleWares } = require('../middlewares');
const { dashboardController } = require('../controllers');
const { DASHBOARD_CONSTANT } = require('../utils/constants');

// get no of contact us, users, & travel route
router.route(DASHBOARD_CONSTANT.DASHBOARD_DATA).get(middleWares.authenticateToken, middleWares.isAdmin, dashboardController.dashData);

module.exports = router;