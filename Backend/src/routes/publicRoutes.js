const express = require('express');
const { listProjects, getSession } = require('../controllers/publicController');

const router = express.Router();

// Public game-facing endpoints (no auth)
router.get('/projects', listProjects);
router.get('/projects/:slug/session', getSession);

module.exports = router;