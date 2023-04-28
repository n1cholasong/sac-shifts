const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController')

router.get('/', function (req, res,) {
    title = "Home";
    res.render('index', { title });
})

router.get('/test', shiftController.test);

// Not in use
router.get('/availabilityList', shiftController.availabilityList);

router.get('/availability', shiftController.availability);

router.get('/schedule', shiftController.schedule);

router.get('/submitAvailability', shiftController.availabilitySubmission);

router.post('/submitAvailability/add', shiftController.addAvailability);

module.exports = router;