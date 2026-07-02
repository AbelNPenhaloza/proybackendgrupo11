const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.set('trust proxy', true);

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

module.exports = app;