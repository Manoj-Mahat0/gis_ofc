const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCallLogs,
  logCall,
  updateCallLog,
  deleteCallLog
} = require('../controllers/callController');

router.use(protect);

router.route('/')
  .get(getCallLogs)
  .post(logCall);

router.route('/:id')
  .put(updateCallLog)
  .delete(deleteCallLog);

module.exports = router;
