// usersController.js
const passport = require('passport');
const User = require('../dao/models/users');
const { customizeError } = require('../middleware/errorHandler');
const { sendPasswordResetEmail } = require('../utils/mailService.js');
const { generateResetToken } = require('../utils/tokens.js');
const bcrypt = require('bcrypt');
const { logger } = require('../utils/logger.js');


// Registro de usuarios
exports.registerUser = (req, res, next) => {
    passport.authenticate('local.register', {
        successRedirect: '/products',
        failureRedirect: '/register',
    })(req, res, next);
};

// Inicio de sesión de usuarios
exports.loginUser = (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/products',
        failureRedirect: '/login',
    })(req, res, next);
};

// Autenticación de GitHub
exports.githubLogin = passport.authenticate('github', { scope: ['user:email'] });

exports.githubCallback = (req, res, next) => {
    passport.authenticate('github', { failureRedirect: '/' }, (err, user) => {
        if (err || !user) {
            return res.redirect('/');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/products');
        });
    })(req, res, next);
};
// Cierre de sesión de usuarios
exports.logoutUser = async (req, res) => {
    try {
        if (req.user.email) {
            await User.findOneAndUpdate(
                { email: req.user.email },
                { last_connection: new Date() }
            ).exec();
        } else {
            logger.info('No se pudo actualizar last_connection: no se encontró información de usuario en la sesión.');
        }
    } catch (error) {
        console.log('Error al actualizar last_connection:', error);
    }

    req.session.destroy(err => {
        if (err) {
            logger.error('Error al cerrar sesión:', err);
            return res.redirect('/');
        }
        res.redirect('/login');
    });
};

// Obtener información del usuario actual
exports.getCurrentUserInfo = async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            const currentUser = req.user;
            const userFromDB = await User.findById(currentUser._id);
            if (userFromDB.role === 'admin') {
                const allUsers = await User.find();
                res.render('current', { user: userFromDB, isAdmin: true, users: allUsers });
            } else {
                res.render('current', { user: userFromDB, isAdmin: false, message: 'Usted no tiene rango admin para acceder a este sitio' });
            }
        } else {
            res.render('current', { user: null });
        }
    } catch (error) {
        logger.error('Error al obtener el usuario actual:', error);
        res.status(500).render('error', { message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

// Renderizar formulario de restablecimiento de contraseña
exports.renderResetPasswordForm = async (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token });
};

// Procesar restablecimiento de contraseña
exports.processResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ message: 'Token de restablecimiento de contraseña inválido o expirado' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.redirect("/login");
    } catch (error) {
        logger.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Procesar restablecimiento de contraseña (continuación)
exports.processResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirm_password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ message: 'Token de restablecimiento de contraseña inválido o expirado' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.redirect("/login");
    } catch (error) {
        logger.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Solicitar restablecimiento de contraseña (envío de correo)
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
        }

        const resetToken = generateResetToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        await sendPasswordResetEmail(email, resetToken);

        res.redirect("/login");
    } catch (error) {
        logger.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
        res.redirect("/login");
    }
};

// Verificar si un usuario tiene un token de restablecimiento de contraseña
exports.checkResetToken = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        if (user.resetPasswordToken) {
            return res.status(200).json({ status: 'success', message: 'El usuario tiene un token de restablecimiento de contraseña' });
        } else {
            return res.status(400).json({ status: 'error', message: 'El usuario no tiene un token de restablecimiento de contraseña' });
        }
    } catch (error) {
        logger.error('Error al verificar el token de restablecimiento de contraseña:', error);
        return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
};