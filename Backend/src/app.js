const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const prisma = require('./db');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const projectRoutes = require('./routes/projectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const publicSettingsRoutes = require('./routes/publicSettingsRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

/**
 * CORS
 * ----
 * Game origins are read from the Settings table in MySQL.
 * Cached in memory and refreshed when settings are updated via API.
 * Falls back to ALLOWED_GAME_ORIGINS env var if DB is not ready.
 */
const parseOrigins = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

const ADMIN_ORIGINS = parseOrigins(process.env.ALLOWED_ORIGINS);
let gameOriginsCache = null;

const refreshGameOriginsCache = async () => {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings && settings.allowedGameOrigins) {
      const origins = typeof settings.allowedGameOrigins === 'string'
        ? JSON.parse(settings.allowedGameOrigins)
        : settings.allowedGameOrigins;
      if (Array.isArray(origins) && origins.length > 0) {
        gameOriginsCache = origins;
      } else {
        gameOriginsCache = parseOrigins(process.env.ALLOWED_GAME_ORIGINS);
      }
    } else {
      gameOriginsCache = parseOrigins(process.env.ALLOWED_GAME_ORIGINS);
    }
  } catch {
    gameOriginsCache = parseOrigins(process.env.ALLOWED_GAME_ORIGINS);
  }
};

const corsMiddleware = async (req, res, next) => {
  const origin = req.headers.origin;
  const isGameEndpoint = req.path.startsWith('/api/public');

  const setCorsHeaders = (allowlist) => {
    if (!origin || allowlist.length === 0 || allowlist.includes(origin.replace(/\/$/, ''))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
  };

  if (isGameEndpoint) {
    // Extract slug from path: /api/public/projects/:slug/session
    const slugMatch = req.path.match(/^\/api\/public\/projects\/([^/]+)/);
    if (slugMatch && origin) {
      try {
        const project = await prisma.project.findUnique({ where: { slug: slugMatch[1] } });
        if (project && project.allowedOrigins) {
          const origins = typeof project.allowedOrigins === 'string'
            ? JSON.parse(project.allowedOrigins)
            : project.allowedOrigins;
          if (Array.isArray(origins) && origins.length > 0) {
            setCorsHeaders(origins);
          } else {
            // Fallback to global settings
            setCorsHeaders(gameOriginsCache || parseOrigins(process.env.ALLOWED_GAME_ORIGINS));
          }
        } else {
          setCorsHeaders(gameOriginsCache || parseOrigins(process.env.ALLOWED_GAME_ORIGINS));
        }
      } catch {
        setCorsHeaders(gameOriginsCache || parseOrigins(process.env.ALLOWED_GAME_ORIGINS));
      }
    } else {
      setCorsHeaders(gameOriginsCache || parseOrigins(process.env.ALLOWED_GAME_ORIGINS));
    }
  } else {
    setCorsHeaders(ADMIN_ORIGINS);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/public-settings', publicSettingsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', questionRoutes);
app.use('/api/settings', settingsRoutes);

// Wire up settings cache refresh
const { setOnSettingsUpdate } = require('./controllers/settingsController');
setOnSettingsUpdate(refreshGameOriginsCache);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', '..', 'Frontend', 'dist');
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  // 404 handler only in development (API-only mode)
  app.use(notFound);
}

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Seed a default admin if the database is empty
const seedDefaultAdmin = async () => {
  const count = await prisma.admin.count();
  if (count === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        name: 'Super Admin',
        email: 'admin@gamecenter.com',
        passwordHash,
        role: 'super_admin',
      },
    });
    console.log('✔ Default admin seeded: admin@gamecenter.com / admin123');
  }
};

const start = async () => {
  // JWT_SECRET is required for signing/verifying tokens (no insecure fallback).
  if (!process.env.JWT_SECRET) {
    console.error('✘ JWT_SECRET is not set. Add it to your .env before starting.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('✘ DATABASE_URL is not set. Add a MySQL connection string to your .env before starting.');
    console.error('  Example: DATABASE_URL=mysql://root:password@localhost:3306/admin_panel');
    process.exit(1);
  }
  if (process.env.AUTH_BYPASS === 'true') {
    console.log('⚠ AUTH_BYPASS=true — login is bypassed (DEMO MODE). Do not use in production.');
  }
  console.log(
    ADMIN_ORIGINS.length
      ? `✔ Admin API restricted to: ${ADMIN_ORIGINS.join(', ')}`
      : '⚠ ALLOWED_ORIGINS not set — admin API accepts any origin (fine locally).'
  );

  // Connect to MySQL via Prisma
  try {
    await prisma.$connect();
    console.log('✔ MySQL connected via Prisma');
  } catch (err) {
    console.error(`✘ Could not connect to MySQL: ${err.message}`);
    console.error('  Check your DATABASE_URL in .env');
    process.exit(1);
  }

  // Auto-seed default admin for easy demo
  await seedDefaultAdmin();

  // Load game origins cache from DB
  await refreshGameOriginsCache();

  console.log(
    gameOriginsCache && gameOriginsCache.length
      ? `✔ Game endpoint restricted to: ${gameOriginsCache.join(', ')}`
      : '⚠ ALLOWED_GAME_ORIGINS not set — game endpoint accepts any origin.'
  );

  app.listen(PORT, () => {
    console.log(`✔ Server running on http://localhost:${PORT}`);
  });
};

start();

module.exports = app;