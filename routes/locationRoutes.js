const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for location routes
router.use(protect);

router.get('/', (req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Location logged' });
});

module.exports = router;
