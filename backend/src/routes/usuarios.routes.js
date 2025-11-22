const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');


<<<<<<< HEAD
=======

// --- RUTAS ESPECÍFICAS ---
router.get('/inactivos/todos', ctrl.obtenerUsuariosInactivos);

// --- RUTAS GENERALES ---
router.get('/', ctrl.obtenerTodosUsuarios);

// --- RUTAS CON PARÁMETROS ---
router.get('/:id', ctrl.obtenerUsuarioPorId);

// --- CREACIÓN ---
router.post('/', ctrl.crearUsuario);

// --- ACTUALIZACIÓN ---
router.put('/:id', ctrl.actualizarUsuario);
router.patch('/:id/ultimo-login', ctrl.actualizarUltimoLogin);
router.patch('/:id', ctrl.actualizarUsuarioParcial);

// --- ELIMINACIÓN Y RESTAURACIÓN ---
router.post('/:id/restaurar', ctrl.restaurarUsuario);
router.delete('/:id/permanente', ctrl.eliminarUsuarioPermanente);
router.delete('/:id', ctrl.eliminarUsuario);

>>>>>>> 182a8617f2ade163f6728154f175c1ee4bd99fad
module.exports = router;