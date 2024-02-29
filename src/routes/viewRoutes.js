// viewRoutes.js
const express = require('express');
const router = express.Router();
const session = require('express-session');
const isAuthenticated = require('../middleware/auth.middleware')

//---------------------------------------------------------------------------------------


router.get('/login', (req, res) => {
    res.render('loginForm');
});


router.get('/register', (req, res) => {
    res.render('registerForm');
});




router.get('/userProfile', isAuthenticated, (req, res) => {
    if (req.user) {
        res.render('userProfile', { user: req.user });
        console.log(req.user);
    } else {
        res.redirect('/login');
        console.log(req.user);
    }
});



module.exports = router;
