const { sequelize } = require('../config/database');
const Usuario = require('./usuario.model');
const AuditoriaLog = require('./auditoriaLog.model');

// Asociaciones: un Usuario puede tener muchos registros de auditoría
// (por ejemplo, varios logins a lo largo del tiempo).
Usuario.hasMany(AuditoriaLog, { foreignKey: 'usuario_id' });
AuditoriaLog.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  Usuario,
  AuditoriaLog,
};