const { AuditoriaLog } = require('../models');

// Helper simple para no repetir el AuditoriaLog.create(...) en cada
// controller que necesite dejar un registro de auditoría.
async function registrarAuditoria({ usuario_id, accion, descripcion, ip_origen }) {
  await AuditoriaLog.create({
    usuario_id,
    accion,
    descripcion,
    ip_origen,
  });
}

module.exports = { registrarAuditoria };