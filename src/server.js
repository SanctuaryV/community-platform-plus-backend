const express = require('express');
const http = require('http');                // NEW
const cors = require('cors');
const { Server } = require('socket.io');     // prefer import style
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

// CORS for REST (since we proxy via Nginx, this can be permissive or specific)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT']
}));

app.use(express.json());
app.use(bodyParser.json());

// Static assets
app.use('/post', express.static(path.join(__dirname, '..', 'post')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check (useful for probes & quick tests)
app.get('/health', (req, res) => res.status(200).send('ok'));

// Routes
app.use('/', authRoutes);
app.use('/', messageRoutes);
app.use('/', profileRoutes);
app.use('/', communityRoutes);
app.use('/', postRoutes);
app.use('/', chat);
app.use('/', mainRoutes);

// Create HTTP server explicitly and attach Socket.IO with explicit PATH
const server = http.createServer(app);
const io = new Server(server, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  // With Nginx same-origin proxy, CORS is not required for WS,
  // but leaving it explicit is okay:
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
    socket.to(roomId).emit('roomJoined', { roomId });
  });

  socket.on('send_message', (messageData) => {
    const { roomId, senderId, message } = messageData;
    const query = 'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)';
    connection.execute(query, [roomId, senderId, message], (err) => {
      if (err) {
        console.error('Error inserting message:', err);
        return;
      }
      io.to(roomId).emit('receive_message', messageData);
    });
  });

  socket.on('disconnect', () => {});
});

// DB connect
connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected to database');
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
