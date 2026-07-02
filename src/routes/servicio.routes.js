const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicio.controller');

// Importamos los middlewares que ya tenés listos
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Rutas Públicas (Los clientes necesitan ver el catálogo sin estar logueados)
router.get('/', servicioController.obtenerServicios);
router.get('/:id', servicioController.obtenerServicioPorId);

// Rutas Protegidas (Solo el Administrador gestiona el catálogo)
router.post('/', verificarToken, verificarRol('ADMINISTRADOR'), servicioController.crearServicio);
router.put('/:id', verificarToken, verificarRol('ADMINISTRADOR'), servicioController.actualizarServicio);
router.delete('/:id', verificarToken, verificarRol('ADMINISTRADOR'), servicioController.eliminarServicio);

// Ruta para restaurar un servicio eliminado (Soft Delete)
router.post('/:id/restaurar', verificarToken, verificarRol('ADMINISTRADOR'), servicioController.restaurarServicio);

module.exports = router;