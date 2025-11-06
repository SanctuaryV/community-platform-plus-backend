// backend/src/controllers/messages.controller.js
const connection = require('../config/db.config'); // เชื่อมต่อกับฐานข้อมูล
const Logger = require('../utils/logger');

// ฟังก์ชันดึงข้อมูลข้อความจากห้องที่ระบุ
const getMessages = (req, res) => {
    const { roomId } = req.params; // รับ roomId จาก URL params
    Logger.apiStart('MESSAGES', 'Get Messages', { roomId });

    connection.execute(
        'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC',
        [roomId],
        (err, results) => {
            if (err) {
                Logger.error('MESSAGES', 'Error fetching messages', err);
                return res.status(500).send('Internal Server Error');
            }
            Logger.success('MESSAGES', `Fetched ${results.length} messages`, { roomId, count: results.length });
            Logger.apiEnd('MESSAGES', 'Get Messages');
            res.json(results); // ส่งข้อมูลข้อความทั้งหมดในห้อง
        }
    );
};

// ฟังก์ชันส่งข้อความใหม่ไปยังห้อง
const sendMessage = (req, res) => {
    const { roomId } = req.params; // รับ roomId จาก URL params
    const { senderId, message } = req.body; // รับ senderId และข้อความจาก body
    Logger.apiStart('MESSAGES', 'Send Message', { roomId, senderId });

    connection.execute(
        'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)',
        [roomId, senderId, message],
        (err, results) => {
            if (err) {
                Logger.error('MESSAGES', 'Error sending message', err);
                return res.status(500).send('Internal Server Error');
            }
            const newMessage = { id: results.insertId, roomId, senderId, message, timestamp: new Date() };
            Logger.success('MESSAGES', 'Message sent successfully', { messageId: results.insertId, roomId });
            Logger.apiEnd('MESSAGES', 'Send Message');
            res.json(newMessage); // ส่งข้อมูลข้อความใหม่ที่ถูกเพิ่ม
        }
    );
};

const getuser = (req, res) => {
    connection.execute(
        'SeELECT * FROM users WHERE',
    )
};

module.exports = {
    getMessages,
    sendMessage,
    getuser
};
