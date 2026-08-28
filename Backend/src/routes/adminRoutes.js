const express = require('express');
const { body } = require('express-validator');
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} = require('../controllers/adminController');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect, requireSuperAdmin);

router.get('/', getAdmins);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['super_admin', 'sub_admin']).withMessage('Invalid role'),
  ],
  validate,
  createAdmin
);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['super_admin', 'sub_admin']).withMessage('Invalid role'),
  ],
  validate,
  updateAdmin
);

router.delete('/:id', deleteAdmin);

module.exports = router;