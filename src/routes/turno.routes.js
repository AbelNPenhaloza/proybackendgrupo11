const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turno.controller');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Crear y consultar turnos (Cualquier usuario logueado puede hacerlo)
router.post('/', verificarToken, turnoController.agendarTurno);
router.get('/', verificarToken, turnoController.obtenerTurnos);
router.get('/:id', verificarToken, turnoController.obtenerTurnoPorId);

// Actualizar un turno (El controlador ya tiene la lógica de límite de horas)
router.put('/:id', verificarToken, turnoController.actualizarTurno);

// Eliminar un turno (Lo limitamos a Administrador y Recepcionista)
router.delete('/:id', verificarToken, verificarRol('ADMINISTRADOR', 'RECEPCIONISTA'), turnoController.eliminarTurno);

// Restaurar un turno (Solo Administrador y Recepcionista)
router.post('/:id/restaurar', verificarToken, verificarRol('ADMINISTRADOR', 'RECEPCIONISTA'), turnoController.restaurarTurno);

module.exports = router;