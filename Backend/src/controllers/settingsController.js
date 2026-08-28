const prisma = require('../db');
const { wrapAll } = require('../utils/asyncHandler');

// Will be set by app.js after cache refresh function is available
let onSettingsUpdate = null;
const setOnSettingsUpdate = (fn) => { onSettingsUpdate = fn; };

const getSettings = async (req, res) => {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  const origins = typeof settings.allowedGameOrigins === 'string'
    ? JSON.parse(settings.allowedGameOrigins)
    : (settings.allowedGameOrigins || []);
  res.json({
    allowedGameOrigins: origins,
    publicApiBase: settings.publicApiBase,
  });
};

const updateSettings = async (req, res) => {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  const { allowedGameOrigins, publicApiBase } = req.body;
  const updateData = {};

  if (allowedGameOrigins !== undefined) {
    let origins;
    if (Array.isArray(allowedGameOrigins)) {
      origins = allowedGameOrigins
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean);
    } else {
      origins = allowedGameOrigins
        .split(',')
        .map((s) => s.trim().replace(/\/$/, ''))
        .filter(Boolean);
    }
    updateData.allowedGameOrigins = origins;
  }
  if (publicApiBase !== undefined) {
    updateData.publicApiBase = publicApiBase.replace(/\/+$/, '');
  }

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: updateData,
  });

  // Refresh CORS cache
  if (onSettingsUpdate) await onSettingsUpdate();

  const resultOrigins = typeof updated.allowedGameOrigins === 'string'
    ? JSON.parse(updated.allowedGameOrigins)
    : (updated.allowedGameOrigins || []);
  res.json({
    allowedGameOrigins: resultOrigins,
    publicApiBase: updated.publicApiBase,
  });
};

module.exports = wrapAll({ getSettings, updateSettings, setOnSettingsUpdate });
