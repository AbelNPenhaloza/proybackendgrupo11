const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 1. Importar todas las rutas
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const barberoRoutes = require('./routes/barbero.routes');
const servicioRoutes = require('./routes/servicio.routes');
const turnoRoutes = require('./routes/turno.routes');
const pagoRoutes = require('./routes/pago.routes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();


// Configuración para proxies
app.set('trust proxy', true);

// Configuración de CORS (le agregamos un fallback a '*' por si falta la variable de entorno en local)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(express.json());

// 2. Montar las rutas
// Nota: al montar healthRoutes en '/api', la ruta final de testeo será 'localhost:3000/api/health'
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/barberos', barberoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/pagos', pagoRoutes);

// 3. Manejador de errores (Siempre debe ir al final de todo)
app.use(errorHandler);

module.exports = app;