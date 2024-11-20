const express = require('express');
const { createRoom, getRooms } = require('../sockets/chatSocket');  // นำเข้าฟังก์ชันที่ต้องใช้
const router = express.Router();

// Route สำหรับดึงข้อมูลห้องทั้งหมด
router.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await getRooms();  // สมมุติว่า getRooms() จะดึงข้อมูลห้องทั้งหมดจากฐานข้อมูล
        res.json(rooms);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ message: 'Error fetching rooms' });
    }
});

// Route สำหรับการสร้างห้องใหม่
router.post('/api/rooms', async (req, res) => {
    try {
        const { user1Id, user2Id } = req.body;  // รับค่า userId จาก body
        const room = await createRoom(user1Id, user2Id);  // สร้างห้องใหม่
        res.status(201).json(room);  // ส่งข้อมูลห้องที่สร้างกลับไป
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).json({ message: 'Error creating room' });
    }
});

module.exports = router;
