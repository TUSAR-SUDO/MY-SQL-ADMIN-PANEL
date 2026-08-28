const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

// @desc    List admins
// @route   GET /api/admins
// @access  Private (super_admin)
const getAdmins = async (req, res) => {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  // Map id → _id for frontend compatibility
  res.json(admins.map((a) => ({ ...a, _id: a.id })));
};

// @desc    Create admin
// @route   POST /api/admins
// @access  Private (super_admin)
const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;
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
      role: role || 'sub_admin',
    },
  });
  res.status(201).json({
    _id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
  });
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (super_admin)
const updateAdmin = async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: Number(req.params.id) } });
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }
  const { name, email, password, role } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase();
  if (role !== undefined) updateData.role = role;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: updateData,
  });
  res.json({
    _id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
  });
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (super_admin)
const deleteAdmin = async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: Number(req.params.id) } });
  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }
  if (admin.id === req.admin._id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  await prisma.admin.delete({ where: { id: admin.id } });
  res.json({ message: 'Admin removed' });
};

module.exports = wrapAll({ getAdmins, createAdmin, updateAdmin, deleteAdmin });