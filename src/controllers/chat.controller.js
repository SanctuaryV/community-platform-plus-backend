const connection = require('../config/db.config');

// ดึงรายชื่อผู้ที่เราติดตาม โดยรับ userId จาก request body
exports.getFollowing = (req, res) => {
    const { userId } = req.body; // รับ userId จาก body ของ request

    const query = `
      SELECT u.user_id AS userId, u.name, u.avatar_url AS avatarUrl
      FROM followers f
      JOIN users u ON f.followed_id = u.user_id
      WHERE f.follower_id = ?
    `;


    // ใช้ callback ในการ query ข้อมูล
    connection.query(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching following:', err);
            return res.status(500).json({ message: 'Error fetching following list' });
        }
        // ส่งข้อมูลผู้ที่เราติดตามกลับไป
        res.status(200).json(rows);
    });
};

exports.getOrCreateRoom = (req, res) => {
    const { userId, otherUserId } = req.body;

    // ตรวจสอบห้องแชทที่มีอยู่แล้ว
    const checkRoomQuery = `
      SELECT room_id FROM rooms
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `;

    connection.query(checkRoomQuery, [userId, otherUserId, otherUserId, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }

        if (results.length > 0) {

            // ถ้ามีห้องแชทแล้ว
            return res.json({ roomId: results[0].room_id });
        } else {
            // ถ้าไม่มีห้องแชท, สร้างห้องใหม่
            const createRoomQuery = `
              INSERT INTO rooms (user1_id, user2_id) VALUES (?, ?)
            `;
            connection.query(createRoomQuery, [userId, otherUserId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create room' });
                }
                return res.json({ roomId: result.insertId }); // ส่ง roomId ของห้องใหม่ที่สร้างขึ้น
            });
        }
    });
};

// ฟังก์ชันในการดึงข้อความ
exports.getMessages = (req, res) => {
    const { roomId } = req.body;  // รับ roomId จาก body ของ POST request
    const query = 'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC';
    
    connection.execute(query, [roomId], (err, result) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Error fetching messages' });
      }
      
      // แปลง sender_id เป็น senderId และแปลงค่าเป็น string
      const updatedResult = result.map((message) => {
        const updatedMessage = { 
          ...message, 
          senderId: String(message.sender_id) // แปลงเป็นสตริง
        };
        delete updatedMessage.sender_id; // ลบฟิลด์ sender_id
        return updatedMessage;
      });
  
      res.json(updatedResult); // ส่งผลลัพธ์ที่ปรับปรุงแล้วกลับไป
    });
  };
  