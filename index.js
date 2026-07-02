require('dotenv').config();
const app = require('./src/app');

const { sequelize, testConnection } = require('./src/config/database');

require('./src/models')

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await testConnection();
    console.log(' Conexión a PostgreSQL establecida.');

    await sequelize.sync(); // dev: crea tablas si no existen, según los modelos definidos

    app.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

start();