const express = require('express');
const { body } = require('express-validator');
const { getSetupStatus, setup, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// First-run setup status (public)
router.get('/setup-status', getSetupStatus);

// Create initial super admin (public, only when no admins exist)
router.post(
  '/setup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  setup
);

// Login (public)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

// Current admin (protected)
router.get('/me', protect, getMe);
router.put(
  '/me',
  protect,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  updateMe
);

module.exports = router;