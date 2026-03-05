const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { updateLocation, getAllStaffLocations } = require('../controllers/locationController');

router.use(protect);

router.route('/')
  .get(authorize('admin'), getAllStaffLocations)
  .post(updateLocation);

module.exports = router;
