// viewRoutes.js

const express = require('express');
const router = express.Router();
const session = require('express-session');


// Ruta para el formulario de login
router.get('/login', (req, res) => {
    // Implementa la lógica para mostrar el formulario de login
    res.render('loginForm');
});

// Ruta para el formulario de registro
router.get('/register', (req, res) => {
    // Implementa la lógica para mostrar el formulario de registro
    res.render('registerForm');
});

// Ruta para renderizar el perfil del usuario (requiere inicio de sesión)
router.get('/userProfile', (req, res) => {
    // Verifica si el usuario está autenticado
    if (req.session.user) {
        // Renderiza el perfil del usuario con los datos del usuario en req.session.user
        res.render('userProfile', { user: req.session.user }); // Asegúrate de tener un archivo profile.hbs en tu carpeta de vistas
    } else {
        // Si no está autenticado, redirige al formulario de inicio de sesión
        res.redirect('/login');
    }
});



module.exports = router;
