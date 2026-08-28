const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const adminResponse = (admin) => ({
  _id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
});

// @desc    Check if setup is required (no admins exist)
// @route   GET /api/auth/setup-status
// @access  Public
const getSetupStatus = async (req, res) => {
  const count = await prisma.admin.count();
  res.json({ setupRequired: count === 0 });
};

// @desc    Create the first super admin (only if no admins exist)
// @route   POST /api/auth/setup
// @access  Public
const setup = async (req, res) => {
  const { name, email, password } = req.body;
  const count = await prisma.admin.count();
  if (count > 0) {
    return res.status(400).json({ message: 'Setup already completed. Please sign in.' });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(400).json({ message: 'An admin with this email already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'super_admin',
    },
  });
  res.status(201).json({
    token: generateToken(admin.id),
    admin: adminResponse(admin),
  });
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({
    token: generateToken(admin.id),
    admin: adminResponse(admin),
  });
};

// @desc    Get current admin
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  if (req.admin) {
    return res.json(adminResponse(req.admin));
  }
  const admin = await prisma.admin.findFirst();
  if (admin) {
    return res.json(adminResponse(admin));
  }
  res.json({
    _id: 1,
    name: 'Super Admin',
    email: 'admin@gamecenter.com',
    role: 'super_admin',
  });
};

// @desc    Update current admin profile (self)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  let admin = null;
  if (req.admin && req.admin._id) {
    admin = await prisma.admin.findUnique({ where: { id: req.admin._id } });
  }
  if (!admin) {
    admin = await prisma.admin.findFirst();
  }
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }
  const { name, email, currentPassword, newPassword } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    const emailLower = email.toLowerCase();
    const existing = await prisma.admin.findFirst({
      where: { email: emailLower, NOT: { id: admin.id } },
    });
    if (existing) {
      return res.status(400).json({ message: 'An admin with this email already exists' });
    }
    updateData.email = emailLower;
  }
  // Password change requires current password verification
  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required to set a new password' });
    }
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 10);
  }
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: updateData,
  });
  res.json(adminResponse(updated));
};

module.exports = wrapAll({ getSetupStatus, setup, login, getMe, updateMe });