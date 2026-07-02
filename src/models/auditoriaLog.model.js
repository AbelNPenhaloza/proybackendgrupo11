const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Modelo AuditoriaLog, según el UML.
// A propósito NO usamos paranoid acá: una tabla de auditoría tiene que ser
// un registro permanente. Si alguien pudiera "borrar" (aunque sea soft)
// una entrada de auditoría, perdería sentido tenerla. Si en el futuro hace
// falta limpiar logs viejos, mejor un proceso explícito de archivado que
// un soft-delete común.
const AuditoriaLog = sequelize.define('AuditoriaLog', {
  auditoria_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  accion: {
    // Por ahora solo usamos LOGIN_EXITOSO (spec 002). Los otros dos valores
    // ya están en el enum porque el UML los define, pero se van a empezar a
    // usar cuando implementemos la gestión de Turnos.
    type: DataTypes.ENUM('LOGIN_EXITOSO', 'TURNO_CREADO', 'TURNO_CANCELADO'),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ip_origen: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'auditoria_logs',
  timestamps: false, // ya tenemos "fecha" a mano, no necesitamos createdAt/updatedAt
});

module.exports = AuditoriaLog;