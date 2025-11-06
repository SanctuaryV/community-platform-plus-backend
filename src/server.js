require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
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
const Logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  if (Object.keys(req.query).length > 0) {
    console.log('Query Params:', req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    console.log('Body:', sanitizedBody);
  }
  next();
});

// CORS for REST (since we proxy via Nginx, this can be permissive or specific)
app.use(cors({
  origin: corsOrigin,
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

// Routes - mounted under /api prefix
app.use('/api', authRoutes);
app.use('/api', messageRoutes);
app.use('/api', profileRoutes);
app.use('/api', communityRoutes);
app.use('/api', postRoutes);
app.use('/api', chat);
app.use('/api', mainRoutes);

// Create HTTP server explicitly and attach Socket.IO with explicit PATH
const server = http.createServer(app);
const socketPath = process.env.SOCKET_PATH || '/socket.io';
const socketTransports = process.env.SOCKET_TRANSPORTS 
  ? process.env.SOCKET_TRANSPORTS.split(',') 
  : ['websocket', 'polling'];

const io = new Server(server, {
  path: socketPath,
  transports: socketTransports,
  // With Nginx same-origin proxy, CORS is not required for WS,
  // but leaving it explicit is okay:
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  Logger.socket('New client connected', { socketId: socket.id });
  
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    Logger.socket('User joined room', { socketId: socket.id, roomId });
    socket.to(roomId).emit('roomJoined', { roomId });
  });

  socket.on('send_message', (messageData) => {
    const { roomId, senderId, message } = messageData;
    Logger.socket('Message received', { roomId, senderId, message: message.substring(0, 50) });
    
    const query = 'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)';
    connection.execute(query, [roomId, senderId, message], (err) => {
      if (err) {
        Logger.error('SOCKET', 'Error inserting message', err);
        return;
      }
      Logger.success('SOCKET', 'Message saved to database');
      io.to(roomId).emit('receive_message', messageData);
      Logger.socket('Message broadcasted to room', { roomId });
    });
  });

  socket.on('disconnect', () => {
    Logger.socket('Client disconnected', { socketId: socket.id });
  });
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
server.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${corsOrigin}`);
  console.log(`Socket.IO Path: ${socketPath}`);
});
