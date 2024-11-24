const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat.controller');

router.post('/following', chatController.getFollowing);

router.post('/room',chatController.getOrCreateRoom);

router.post('/messages', chatController.getMessages);

module.exports = router;