// backend/src/sockets/chatSocket.js
const connection = require('../config/db.config');  // เชื่อมต่อกับฐานข้อมูล

// ฟังก์ชันสร้างห้อง
const createRoom = async (user1Id, user2Id) => {
  return new Promise((resolve, reject) => {
    console.log('user 1: ' + user1Id, 'user 2: ' + user2Id)
    connection.query(
      `SELECT * FROM rooms WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?) LIMIT 1`,
      [user1Id, user2Id, user2Id, user1Id],
      (err, results) => {
        if (err) {
          reject(err);
        } else if (results.length > 0) {
          console.log('Room already exists:', results[0]);
          resolve(results[0]);  // ถ้ามีห้องแล้ว
        } else {
          console.log('Creating new room');
          // สร้างห้องใหม่
          connection.query(
            'INSERT INTO rooms (user1_id, user2_id) VALUES (?, ?)',
            [user1Id, user2Id],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                console.log('Room created:', { roomId: results.insertId });
                resolve({ roomId: results.insertId });  // ส่งกลับห้องใหม่ที่สร้าง
              }
            }
          );
        }
      }
    );
  });
};


// ฟังก์ชันส่งข้อความ
const sendMessage = (roomId, senderId, message) => {
  return new Promise((resolve, reject) => {
    // บันทึกข้อความในฐานข้อมูล
    connection.query(
      'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)',
      [roomId, senderId, message],
      (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
          // ส่งข้อความไปยังห้องใน socket.io
          io.to(roomId).emit('receive_message', { senderId, message, roomId, timestamp: new Date() });
        }
      }
    );
  });
};

const getRooms = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM rooms', (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);  // ส่งกลับข้อมูลห้องทั้งหมด
      }
    });
  });
};

module.exports = { createRoom, sendMessage, getRooms };  // อย่าลืมนำเข้า getRooms

