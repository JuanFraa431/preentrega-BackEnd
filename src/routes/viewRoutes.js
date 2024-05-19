const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth.middleware');
const viewController = require('../controllers/viewController');

// Ruta para mostrar el formulario de inicio de sesión
router.get('/login', viewController.showLoginForm);

// Ruta para mostrar el formulario de registro
router.get('/register', viewController.showRegisterForm);

// Ruta para mostrar el perfil de usuario
router.get('/userProfile', isAuthenticated, viewController.showUserProfile);

// Ruta para mostrar la edición de usuario
router.get('/userEdit', isAuthenticated, viewController.showUserEdit);

module.exports = router;