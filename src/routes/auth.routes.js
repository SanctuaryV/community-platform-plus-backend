// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware')

router.post('/Register', authController.register);
router.post('/Login', authController.login);
router.post('/authen', authMiddleware.authenticate);

module.exports = router;
