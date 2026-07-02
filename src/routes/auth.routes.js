const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Importaciones corregidas SIN llaves 
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Rutas Públicas (No requieren token)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/seed-admin', authController.seedAdmin);

// Rutas Protegidas de Perfil (Cualquier usuario logueado)
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.post('/logout', verificarToken, authController.logout);

// Rutas de Gestión de Usuarios (Solo Administrador)
router.post('/usuarios', verificarToken, verificarRol('ADMINISTRADOR'), authController.crearUsuarioConRol);
router.delete('/usuarios/:id', verificarToken, verificarRol('ADMINISTRADOR'), authController.eliminarUsuario);
router.post('/usuarios/:id/restaurar', verificarToken, verificarRol('ADMINISTRADOR'), authController.restaurarUsuario);

module.exports = router;