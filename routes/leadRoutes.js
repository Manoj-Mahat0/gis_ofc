const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  assignLead,
  importLeads,
  exportLeads
} = require('../controllers/leadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getLeads)
  .post(authorize('admin', 'manager'), createLead);

router.route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(authorize('admin', 'manager'), deleteLead);

router.put('/:id/assign', authorize('admin', 'manager'), assignLead);
router.post('/import', authorize('admin', 'manager'), upload.single('file'), importLeads);
router.get('/export', authorize('admin', 'manager'), exportLeads);

module.exports = router;
