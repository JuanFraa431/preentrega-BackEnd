const express = require('express');
const router = express.Router();
const { createToken } = require('../utils/jwt');
const User = require('../dao/models/users');
const bcrypt = require('bcrypt');

// Ruta para el registro de usuarios
router.post('/register', async (req, res) => {
    try {
        const { first_name, email, password } = req.body;

        if (!first_name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan completar campos obligatorios' });
        }

        const userFound = await User.findOne({ email });
        if (userFound) {
            return res.status(400).json({ status: 'error', message: 'Ya existe el usuario' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = (email === "adminCoder@coder.com") ? "admin" : "user";

        const newUser = {
            first_name,
            email,
            password: hashedPassword,
            role: role
        };

        const result = await User.create(newUser);
        const token = createToken({ id: result._id, role: result.role });

        return res.status(201).json({ status: 'success', message: 'Usuario registrado exitosamente', token });
    } catch (error) {
        console.error('Error durante el registro:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
});

// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Faltan completar campos obligatorios' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Email o contraseña incorrectos' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ status: 'error', message: 'Email o contraseña incorrectos' });
        }

        const token = createToken({ id: user._id, role: user.role });

        res.status(200).json({ status: 'success', message: 'Inicio de sesión exitoso', token });
        res.redirect('/products');
    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
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
            return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
        }
        res.status(200).json({ status: 'success', message: 'Sesión cerrada exitosamente' });
    });
});

module.exports = router;