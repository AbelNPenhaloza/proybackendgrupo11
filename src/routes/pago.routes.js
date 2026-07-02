const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Consultar pagos (Solo Administradores y Recepcionistas pueden ver el historial de pagos)
router.get('/:turno_id', verificarToken, verificarRol('ADMINISTRADOR', 'RECEPCIONISTA'), pagoController.obtenerPagoPorTurno);

// Registrar un pago (Administrador o Recepcionista)
router.post('/', verificarToken, verificarRol('ADMINISTRADOR', 'RECEPCIONISTA'), pagoController.registrarPago);

// Actualizar estado del pago (ej: confirmar transferencia o pago online)
router.put('/:id/estado', verificarToken, verificarRol('ADMINISTRADOR', 'RECEPCIONISTA'), pagoController.actualizarEstadoPago);

// Eliminar un pago (Solo Admin)
router.delete('/:id', verificarToken, verificarRol('ADMINISTRADOR'), pagoController.eliminarPago);

// Restaurar un pago eliminado (Solo Admin)
router.post('/:id/restaurar', verificarToken, verificarRol('ADMINISTRADOR'), pagoController.restaurarPago);

module.exports = router;