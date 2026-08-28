const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  uploadQuestions,
  getRecentQuestions,
  bulkDeleteQuestions,
  seedSampleQuestions,
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Multer in-memory storage for file parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isCsv = file.originalname.toLowerCase().endsWith('.csv');
    const isDocx = file.originalname.toLowerCase().endsWith('.docx');
    if (isCsv || isDocx) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and DOCX files are allowed'));
    }
  },
});

router.use(protect);

// Recent questions (must be before /:id routes)
router.get('/questions/recent', getRecentQuestions);

// List questions for a project
router.get('/projects/:id/questions', getQuestions);

// Add single question
router.post(
  '/projects/:id/questions',
  [
    body('field1').notEmpty().withMessage('Field 1 is required'),
  ],
  validate,
  addQuestion
);

// Upload CSV/DOCX
router.post('/projects/:id/questions/upload', upload.single('file'), uploadQuestions);

// Bulk delete questions
router.post('/projects/:id/questions/bulk-delete', bulkDeleteQuestions);

// Seed sample questions
router.post('/projects/:id/questions/sample-seed', seedSampleQuestions);

// Update question
router.put(
  '/questions/:id',
  [
    body('field1').optional().notEmpty().withMessage('Field 1 cannot be empty'),
  ],
  validate,
  updateQuestion
);

// Delete question
router.delete('/questions/:id', deleteQuestion);

module.exports = router;