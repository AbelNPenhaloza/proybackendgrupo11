const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

router.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    // 200 OK: Todo funciona perfectamente
    res.status(200).json({ server: 'up', database: 'up' });
  } catch (error) {
    // 503 Service Unavailable: El servidor responde, pero la BD está caída
    res.status(503).json({ server: 'up', database: 'down' });
  }
});

module.exports = router;