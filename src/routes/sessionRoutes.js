const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const User = require('../dao/models/users');


// Ruta para el registro de usuarios
router.post('/register', async (req, res, next) => {
    passport.authenticate('local.register', {
        successRedirect: '/products',  
        failureRedirect: '/register',   
    })(req, res, next);
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/products',
        failureRedirect: '/login',
    })(req, res, next);
});

// Ruta de passport
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/githubcallback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/products');
    }
);

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.redirect('/'); 
        }
        res.redirect('/login'); 
    });
});
router.get('/current', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (req.isAuthenticated()) {
            const currentUser = req.user;

            // Obtener el usuario actual desde la base de datos (ajusta según tu modelo)
            const userFromDB = await User.findById(currentUser._id);

            // Verificar el rol del usuario
            if (userFromDB.role === 'admin') {
                // Si el rol es admin, obtener todos los usuarios
                const allUsers = await User.find();

                // Renderizar la vista con la información de los usuarios
                res.render('current', { user: userFromDB, isAdmin: true, users: allUsers });
            } else {
                // Si el rol es user, mostrar un mensaje de acceso denegado
                res.render('current', { user: userFromDB, isAdmin: false, message: 'Usted no tiene rango admin para acceder a este sitio' });
            }
        } else {
            // Si no está autenticado, renderizar la vista con un mensaje apropiado
            res.render('current', { user: null });
        }
    } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
        res.status(500).render('error', { message: 'Error interno del servidor' });
    }
});

module.exports = router;


module.exports = router;