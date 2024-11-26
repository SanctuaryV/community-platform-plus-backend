const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main.controller');

// API เส้นทางสำหรับดึงข้อมูลโพสต์
router.post('/main', mainController.mainPosts);

module.exports = router;
