const router = require("express").Router();

const { middleWares } = require('../middlewares');
const { locationController } = require('../controllers');

// Add cities for specific country
router.post('/addcities', middleWares.authenticateToken, locationController.addCities);

// Filter location with cities & countries
router.get('/filterlocation', locationController.filterLocation);

module.exports = router;