// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware')

router.post('/Register', authController.register);
router.post('/Login', authController.login);
// Attach a final handler so calls to /authen that run the auth middleware get a response
router.post('/authen', authMiddleware.authenticate, (req, res) => res.sendStatus(200));

module.exports = router;
