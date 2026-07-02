const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Turno = sequelize.define('Turno', {
  turno_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Las claves foráneas (cliente_id, barbero_id, servicio_id) no las definimos 
  // manualmente acá porque Sequelize las crea solas en el index.js con las asociaciones.
  
  fecha: {
    type: DataTypes.DATEONLY, // Solo guarda 'YYYY-MM-DD', ideal para el calendario
    allowNull: false,
    validate: {
      isDate: { msg: 'Debe ser una fecha válida' }
    }
  },
  hora_inicio: {
    type: DataTypes.TIME, // Guarda 'HH:MM:SS'
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'CONFIRMADO', 'ATENDIDO', 'CANCELADO'),
    defaultValue: 'PENDIENTE',
    allowNull: false,
  },
  notas: {
    type: DataTypes.STRING,
    allowNull: true, // Es opcional, por si el cliente o el barbero quieren dejar un comentario
  }
}, {
  tableName: 'turnos',
  timestamps: true, // Crea createdAt y updatedAt automáticamente
  paranoid: true,   // Habilita el borrado lógico (deletedAt)
});

module.exports = Turno;