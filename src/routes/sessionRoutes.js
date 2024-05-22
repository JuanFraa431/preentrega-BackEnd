// sessionRouter.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const sessionController = require('../controllers/sessionController');
const { initializePassportGitHub, initializePassportLocal } = require('../config/passport.config')
initializePassportLocal()
initializePassportGitHub()

router.post('/register', usersController.registerUser);
router.post('/login', usersController.loginUser);
router.get('/github', sessionController.githubLogin);
router.get('/githubcallback', sessionController.githubCallback);
router.get('/logout', usersController.logoutUser);
router.get('/current', usersController.getCurrentUserInfo);
router.get('/reset-password/:token', usersController.renderResetPasswordForm);
router.post('/reset-password/:token', usersController.processResetPassword);
router.post('/reset-password', usersController.requestPasswordReset);
router.get('/check-reset-token/:email', usersController.checkResetToken);

module.exports = router;