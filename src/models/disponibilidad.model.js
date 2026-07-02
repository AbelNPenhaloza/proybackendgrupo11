const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Disponibilidad = sequelize.define('Disponibilidad', {
  disponibilidad_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  barbero_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  dia_semana: {
    // 0 = Domingo, 1 = Lunes, ... 6 = Sábado (mismo criterio que
    // date.getDay() de JavaScript, según el material de la cátedra sobre
    // fechas -- así evitamos confusiones al comparar contra un Date real
    // más adelante, en la spec de Turnos).
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'dia_semana debe estar entre 0 y 6' },
      max: { args: [6], msg: 'dia_semana debe estar entre 0 y 6' },
    },
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'disponibilidades',
  timestamps: true,
  // Sin paranoid acá: si un bloque de disponibilidad ya no aplica, tiene
  // más sentido borrarlo directo (no hay "historial" de horarios que
  // conservar, a diferencia de Usuario/Barbero).
});

module.exports = Disponibilidad;