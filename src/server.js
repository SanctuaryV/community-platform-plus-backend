const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.routes');
const messageRoutes = require('./routes/messages.routes');
const profileRoutes = require('./routes/profile.routes');  // เชื่อมโยงกับ profile.routes.js
const connection = require('./config/db.config');
const { createRoom, sendMessage } = require('./sockets/chatSocket');
const roomRoutes = require('./routes/rooms.routes');
const path = require('path');

const app = express();
const port = 8000;
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// สร้าง HTTP server และเชื่อมกับ socket.io
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// สร้างตัว instance ของ socket.io ที่เชื่อมกับ HTTP server และตั้งค่า CORS
const io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:3000',  // localhost สำหรับการพัฒนา
        'http://192.168.1.101:3000'  // IP ของมือถือ
      ],
      methods: ['GET', 'POST'],
    },
  });

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

// กำหนดเส้นทาง
app.use('/', authRoutes);
app.use('/', messageRoutes);
app.use('/', roomRoutes);
app.use('/', profileRoutes);

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected to database');
});

// เชื่อมต่อ socket.io กับ events
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', async (user1Id, user2Id) => {
        try {
            const room = await createRoom(user1Id, user2Id);
            socket.join(room.roomId);
            console.log(`User joined room: ${room.roomId}`);
            socket.emit('roomJoined', { roomId: room.roomId });
        } catch (err) {
            console.error('Error creating or joining room:', err);
        }
    });

    socket.on('send_message', async (messageData) => {
        try {
            await sendMessage(messageData.roomId, messageData.senderId, messageData.message);
        } catch (err) {
            console.error('Error sending message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
