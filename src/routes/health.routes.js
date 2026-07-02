const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

router.get('/health', async (req, res) => {
  let dbStatus = 'down';
  try {
    await sequelize.authenticate();
    dbStatus = 'up';
  } catch {
    dbStatus = 'down';
  }
  res.json({ server: 'up', database: dbStatus });
});

module.exports = router;