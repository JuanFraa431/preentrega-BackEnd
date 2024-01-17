// viewRoutes.js
const express = require('express');
const router = express.Router();
const session = require('express-session');
//const { isAuthenticated } = require('../utils/jwt');


const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login'); 
};


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
router.get('/userProfile', isAuthenticated, (req, res) => {
    // Verifica si el usuario está autenticado
    if (req.user) {
        // Renderiza el perfil del usuario con los datos del usuario en req.user
        res.render('userProfile', { user: req.user });
        console.log(req.user);
    } else {
        // Si no está autenticado, redirige al formulario de inicio de sesión
        res.redirect('/login');
        console.log(req.user);
    }
});



module.exports = router;
