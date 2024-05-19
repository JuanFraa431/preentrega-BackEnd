const User = require('../dao/models/users');
const { customizeError } = require("../middleware/errorHandler");

// Mostrar el formulario de inicio de sesión
exports.showLoginForm = (req, res) => {
    res.render('loginForm');
};

// Mostrar el formulario de registro
exports.showRegisterForm = (req, res) => {
    res.render('registerForm');
};

// Mostrar el perfil de usuario
exports.showUserProfile = async (req, res) => {
    try {
        const user = req.user;
        if (user) {
            const isAdmin = user.role === 'admin';
            const isPremium = user.role === 'premium';
            const isUser = user.role === 'user';
            if (req.user) {
                res.render('userProfile', { user: req.user, isAdmin, isPremium, isUser });
            } else {
                res.redirect('/login');
            }
        }
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};

// Mostrar la edición de usuario
exports.showUserEdit = async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user.role === 'admin';
        const isPremium = user.role === 'premium';
        const isUser = user.role === 'user';
        const allUsers = await User.find({ role: 'user' });
        const allUsersPremiums = await User.find({ role: { $in: ['user', 'premium'] } });
        res.render('userEdit', { user: req.user, isAdmin, isPremium, allUsers, isUser, allUsersPremiums });
    } catch (error) {
        res.status(500).json({ status: "error", message: customizeError('INTERNAL_SERVER_ERROR') });
    }
};