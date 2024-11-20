// backend/src/routes/messages.routes.js
const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');

// กำหนด route สำหรับดึงข้อความในห้อง
router.get('/messages/:roomId', messagesController.getMessages);

// กำหนด route สำหรับส่งข้อความในห้อง
router.post('/messages/:roomId', messagesController.sendMessage);

module.exports = router;
