const jwt = require('jsonwebtoken');
const prisma = require('../db');

/**
 * DEMO BYPASS SWITCH
 * ------------------
 * When AUTH_BYPASS=true, requests without a valid token are treated as the
 * default super admin so the panel can be opened without logging in.
 * This is INSECURE and is intended only for local demos.
 *
 * Leave it unset (or "false") for any real deployment: tokens are then
 * required and invalid/missing tokens are rejected with 401.
 */
const AUTH_BYPASS = process.env.AUTH_BYPASS === 'true';

// Only used in demo bypass mode when the database has no admins yet.
const FALLBACK_ADMIN = {
  _id: 1,
  name: 'Super Admin',
  email: 'admin@gamecenter.com',
  role: 'super_admin',
};

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true },
      });
      if (admin) {
        // Map id → _id for downstream compatibility with frontend expectations
        req.admin = { ...admin, _id: admin.id };
        return next();
      }
      // Token is valid but the admin no longer exists.
      if (!AUTH_BYPASS) {
        return res.status(401).json({ message: 'Not authorized' });
      }
    } catch (err) {
      // Token is missing a signature match, malformed, or expired.
      if (!AUTH_BYPASS) {
        return res.status(401).json({ message: 'Not authorized, token invalid' });
      }
    }
  } else if (!AUTH_BYPASS) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // --- Demo bypass path (only reached when AUTH_BYPASS=true) ---
  const admin = await prisma.admin.findFirst({
    select: { id: true, name: true, email: true, role: true },
  });
  req.admin = admin ? { ...admin, _id: admin.id } : FALLBACK_ADMIN;
  return next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: super admin only' });
};

module.exports = { protect, requireSuperAdmin };
