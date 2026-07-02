const { sequelize } = require('../config/database');

// 1. Importar todos los modelos
const Usuario = require('./usuario.model');
const AuditoriaLog = require('./auditoriaLog.model');
const Barbero = require('./barbero.model');
const Servicio = require('./servicio.model');
const Disponibilidad = require('./disponibilidad.model');
const Turno = require('./turno.model');
const Pago = require('./pago.model');

// 2. Definir las Asociaciones (Relaciones)

// --- USUARIO y AUDITORÍA ---
Usuario.hasMany(AuditoriaLog, { foreignKey: 'usuario_id' });
AuditoriaLog.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// --- USUARIO y BARBERO ---
// Un Usuario (con rol BARBERO) tiene UN solo perfil de Barbero.
Usuario.hasOne(Barbero, { foreignKey: 'usuario_id' });
Barbero.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// --- BARBERO y DISPONIBILIDAD ---
// Un Barbero tiene muchos bloques de Disponibilidad.
Barbero.hasMany(Disponibilidad, { foreignKey: 'barbero_id', as: 'disponibilidad' });
Disponibilidad.belongsTo(Barbero, { foreignKey: 'barbero_id' });


// --- LAS NUEVAS RELACIONES DEL TURNO (Basadas en el UML) ---

// Un Turno pertenece a un Cliente (que es un Usuario)
Turno.belongsTo(Usuario, { as: 'cliente', foreignKey: 'cliente_id' });
Usuario.hasMany(Turno, { as: 'turnos_cliente', foreignKey: 'cliente_id' });

// Un Turno es atendido por un Barbero
Turno.belongsTo(Barbero, { as: 'barbero', foreignKey: 'barbero_id' });
Barbero.hasMany(Turno, { as: 'turnos_asignados', foreignKey: 'barbero_id' });

// Un Turno incluye un Servicio
Turno.belongsTo(Servicio, { as: 'servicio', foreignKey: 'servicio_id' });
Servicio.hasMany(Turno, { as: 'turnos_servicio', foreignKey: 'servicio_id' });

// --- TURNO y PAGO ---
// Un Turno tiene un único Pago (1 a 1)
Turno.hasOne(Pago, { as: 'pago', foreignKey: 'turno_id' });
Pago.belongsTo(Turno, { as: 'turno', foreignKey: 'turno_id' });

// 3. Exportar todo
module.exports = {
  sequelize,
  Usuario,
  AuditoriaLog,
  Barbero,
  Servicio,
  Disponibilidad,
  Turno,
  Pago
};