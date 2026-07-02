const express = require('express');
const router = express.Router();
const barberoController = require('../controllers/barbero.controller');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Rutas Públicas (Los clientes necesitan ver el catálogo sin estar logueados)
router.get('/', barberoController.listarBarberos);
router.get('/:id', barberoController.obtenerBarbero);
router.get('/:id/disponibilidad', barberoController.listarDisponibilidad);

// Gestión del Perfil del Barbero (Solo Administrador)
router.post('/', verificarToken, verificarRol('ADMINISTRADOR'), barberoController.crearBarbero);
router.put('/:id', verificarToken, verificarRol('ADMINISTRADOR'), barberoController.editarBarbero);
router.put('/:id/estado', verificarToken, verificarRol('ADMINISTRADOR'), barberoController.alternarEstadoBarbero);
router.delete('/:id', verificarToken, verificarRol('ADMINISTRADOR'), barberoController.eliminarBarbero);
router.post('/:id/restaurar', verificarToken, verificarRol('ADMINISTRADOR'), barberoController.restaurarBarbero);

// Gestión de Disponibilidad 
// (Lo ideal es que tanto el Admin como el propio Barbero puedan gestionarla)
router.post('/:id/disponibilidad', verificarToken, verificarRol('ADMINISTRADOR', 'BARBERO'), barberoController.agregarDisponibilidad);
router.delete('/:id/disponibilidad/:disponibilidadId', verificarToken, verificarRol('ADMINISTRADOR', 'BARBERO'), barberoController.eliminarDisponibilidad);

module.exports = router;