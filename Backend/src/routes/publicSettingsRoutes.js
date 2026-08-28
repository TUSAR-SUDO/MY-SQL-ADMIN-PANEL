const express = require('express');
const prisma = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json({ publicApiBase: settings.publicApiBase });
  } catch {
    res.json({ publicApiBase: '' });
  }
});

module.exports = router;
