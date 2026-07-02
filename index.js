require('dotenv').config();
const app = require('./src/app');

const { sequelize, testConnection } = require('./src/config/database');

// Importamos los modelos para que Sequelize registre las tablas y relaciones
require('./src/models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await testConnection();
    console.log(' Conexión a PostgreSQL establecida.');

    // Sincronización de la base de datos controlada por booleanos explícitos
    // logging: false evita que la consola se llene de consultas SQL al sincronizar
    await sequelize.sync({ force: false, alter: false, logging: false }); 

    app.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(' No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

start();