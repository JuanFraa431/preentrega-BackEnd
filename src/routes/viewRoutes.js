// viewRoutes.js
const express = require('express');
const router = express.Router();
const session = require('express-session');
const isAuthenticated = require('../middleware/auth.middleware')
const { customizeError } = require("../middleware/errorHandler");
const User = require('../dao/models/users');

//---------------------------------------------------------------------------------------


router.get('/login', (req, res) => {
    res.render('loginForm');
});


router.get('/register', (req, res) => {
    res.render('registerForm');
});



router.get('/userProfile', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            // Verificar el rol del usuario
            const isAdmin = user.role === 'admin';
            const isPremium = user.role === 'premium';
            
            // Si el usuario es administrador o premium, renderizar el perfil
            if (req.user) {
        
                res.render('userProfile', { user: req.user, isAdmin, isPremium});
                console.log(req.user);
            } else {
                res.redirect('/login');
                console.log(req.user);
            }
        }
    } catch (error) {
        // Manejar cualquier error interno del servidor
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.get('/userEdit', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';
        const isPremium = user.role === 'premium';
        const isUser = user.role === 'user';
        const allUsers = await User.find({ role: 'user' });
        const allUsersPremiums = await User.find({ role: { $in: ['user', 'premium'] } })
        console.log(allUsersPremiums)
        res.render('userEdit', { user: req.user, isAdmin, isPremium, allUsers, isUser, allUsersPremiums });
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

router.post('/premium/:uid', async (req, res) => {
    try {
        // Obtiene el ID de usuario de los parámetros de la URL
        const userId = req.params.uid;

        // Obtiene el nuevo rol del cuerpo de la solicitud
        const { newRole } = req.body;

        // Verifica si el nuevo rol es válido
        if (newRole !== 'admin' && newRole !== 'premium') {
            return res.status(400).json({ status: 'error', message: 'Rol inválido' });
        }

        // Busca el usuario por su ID en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        // Actualiza el rol del usuario y guarda los cambios en la base de datos
        user.role = newRole;
        await user.save();

        // Devuelve una respuesta exitosa
        return res.status(200).json({ status: 'success', message: 'Rol de usuario actualizado correctamente', user });
    } catch (error) {
        // Maneja cualquier error que ocurra durante el proceso
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});




module.exports = router;
