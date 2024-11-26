const express = require('express');
const router = express.Router();  // ใช้ express.Router() แทนที่จะเป็น object ทั่วไป
const communityController = require('../controllers/community.controller');  // นำเข้าคอนโทรลเลอร์

// กำหนด route สำหรับดึงข้อมูลกลุ่ม
router.post('/getgroups', communityController.getGroups);

// กำหนด route สำหรับสร้างกลุ่มใหม่
router.post('/creategroups', communityController.createGroup);

// Route สำหรับลบกลุ่ม
router.post('/deletegroup', communityController.deleteGroup);

module.exports = router;  // ส่ง router ออกไป
