const express = require('express');
const router = express.Router();
const session = require('express-session');
const passport = require('passport');
const User = require('../dao/models/users');
const { customizeError } = require("../middleware/errorHandler");
const { sendPasswordResetEmail } = require('../utils/mailService.js');
const { generateResetToken } = require('../utils/tokens.js');
const bcrypt = require('bcrypt');

//---------------------------------------------------------------------------------------

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
        res.status(500).render('error', { message: customizeError('INTERNAL_SERVER_ERROR') });
    }
});

// Ruta para el restablecimiento de contraseña (página de formulario)
router.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token });
});

// Ruta para procesar el restablecimiento de contraseña
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    try {
        // Buscar al usuario por el token de restablecimiento de contraseña
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ message: 'Token de restablecimiento de contraseña inválido o expirado' });
        }

        // Validar las contraseñas
        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        // Encriptar la nueva contraseña
        const hashedPassword = await bcrypt.hash(password, 10); // 10 es el número de rondas de hashing

        // Establecer la nueva contraseña encriptada y eliminar el token de restablecimiento
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida correctamente' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para solicitar restablecimiento de contraseña (envío de correo)
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Buscar al usuario por correo electrónico
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generar y guardar el token de restablecimiento de contraseña
        const resetToken = generateResetToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token válido por 1 hora
        await user.save();

        // Enviar correo electrónico de restablecimiento de contraseña
        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'Correo electrónico de restablecimiento de contraseña enviado' });
    } catch (error) {
        console.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


module.exports = router;




module.exports = router;