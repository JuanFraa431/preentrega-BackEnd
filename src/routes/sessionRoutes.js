// sessionRouter.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');


router.post('/register', usersController.registerUser);
router.post('/login', usersController.loginUser);
router.get('/github', usersController.githubLogin);
router.get('/githubcallback', usersController.githubCallback);
router.get('/logout', usersController.logoutUser);
router.get('/current', usersController.getCurrentUserInfo);
router.get('/reset-password/:token', usersController.renderResetPasswordForm);
router.post('/reset-password/:token', usersController.processResetPassword);
router.post('/reset-password', usersController.requestPasswordReset);
router.get('/check-reset-token/:email', usersController.checkResetToken);

module.exports = router;