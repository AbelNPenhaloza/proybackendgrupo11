const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicio = sequelize.define('Servicio', {
  servicio_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'El nombre no puede estar vacío' } },
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foto_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duracion_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: { args: [5], msg: 'La duración mínima es 5 minutos' } },
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: { args: [0], msg: 'El precio no puede ser negativo' } },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'servicios',
  timestamps: true,
  paranoid: true,
});

module.exports = Servicio;