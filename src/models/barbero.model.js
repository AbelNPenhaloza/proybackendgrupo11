const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Barbero = sequelize.define('Barbero', {
  barbero_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true, // un Usuario solo puede tener UN perfil de Barbero
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  especialidad: {
    type: DataTypes.ENUM('DEGRADADOS', 'CLASICO', 'BARBA', 'COLORISTA'),
    allowNull: false,
  },
  foto_url: {
    // Guarda el string base64 completo (ver nota en proposal-003.md sobre
    // por qué mantenemos el nombre "foto_url" aunque no sea una URL real).
    type: DataTypes.TEXT,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'barberos',
  timestamps: true,
  paranoid: true, // mismo criterio que Usuario: no borrar filas de verdad
});

module.exports = Barbero;