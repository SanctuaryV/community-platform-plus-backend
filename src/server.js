const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.routes');
const chat = require('./routes/chat.routes');
const communityRoutes = require('./routes/community.routes');
const messageRoutes = require('./routes/messages.routes');
const profileRoutes = require('./routes/profile.routes');
const postRoutes = require('./routes/post.routes');
const mainRoutes = require('./routes/main.routes');
const connection = require('./config/db.config');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: "*",  // รองรับทุก origin
    methods: ['GET', 'POST', 'PUT'],
}));

app.use('/post', express.static(path.join(__dirname, '..', 'post')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// สร้าง HTTP server และเชื่อมกับ socket.io
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});

const io = socketIo(server, {
    cors: {
        origin: "*",  // รองรับทุก origin
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
});

app.use(bodyParser.json());

// กำหนดเส้นทาง
app.use('/', authRoutes);
app.use('/', messageRoutes);
app.use('/', profileRoutes);
app.use('/', communityRoutes);
app.use('/', postRoutes);
app.use('/', chat);
app.use('/', mainRoutes);

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
connection.connect((err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected to database');
});

// เชื่อมต่อกับ socket.io
io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
        socket.to(roomId).emit('roomJoined', { roomId });
    });

    socket.on('send_message', (messageData) => {
        const { roomId, senderId, message } = messageData;
        const query = 'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)';
        
        connection.execute(query, [roomId, senderId, message], (err, result) => {
            if (err) {
                console.error('Error inserting message:', err);
                return;
            }
            console.log('Message inserted into database');
            io.to(roomId).emit('receive_message', messageData);
        });
    });

    socket.on('disconnect', () => {});
});
