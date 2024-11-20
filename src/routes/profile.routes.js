// backend/src/routes/profile.routes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// ดึงข้อมูลโปรไฟล์ของผู้ใช้
router.get('/profile/:userId', profileController.getUserProfile);

// อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ (สามารถเพิ่มได้)
router.put('/edit-profile/:userId', profileController.updateUserProfile); // ตัวอย่าง route สำหรับอัปเดตข้อมูล

// เส้นทางสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
router.post('/users', profileController.getAllUsers);

// เส้นทางสำหรับติดตามผู้ใช้
router.post('/follow/:userId', profileController.followUser);

// เส้นทางสำหรับยกเลิกการติดตามผู้ใช้
router.post('/unfollow/:userId', profileController.unfollowUser);

module.exports = router;
