const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/auth.controller');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Rutas públicas (no requieren estar logueado)
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/seed-admin', ctrl.seedAdmin); // solo funciona la primera vez, ver auth.controller.js

// Rutas protegidas
router.get('/perfil', verificarToken, ctrl.perfil);
router.post('/usuarios', verificarToken, verificarRol('ADMINISTRADOR'), ctrl.crearUsuarioConRol);

module.exports = router;