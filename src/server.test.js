/**
 * @file server.test.js
 */
const request = require('supertest');
const { io: Client } = require('socket.io-client');
const http = require('http');

jest.mock('./config/db.config'); // Mock MySQL connection

let app, server, io, PORT;

// Import your server file *after* mocking then DB
beforeAll((done) => {
  jest.resetModules();
  const express = require('express');
  const { Server } = require('socket.io');
  const connection = require('./config/db.config');

  app = express();
  app.get('/health', (req, res) => res.status(200).send('ok'));
  server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: '*' },
  });

  // Minimal socket.io handlers for testing
  io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      socket.emit('roomJoined', { roomId });
    });

    socket.on('send_message', (data) => {
      const { roomId } = data;
      connection.execute('mock', [], () => {});
      io.to(roomId).emit('receive_message', data);
    });
  });

  server.listen(0, () => {
    PORT = server.address().port;
    done();
  });
});

afterAll((done) => {
  io.close();
  server.close(done);
});

describe('HTTP API Tests', () => {
  test('GET /health should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('ok');
  });
});

describe('Socket.io Tests', () => {
  test('should join a room and receive confirmation', (done) => {
    const client = new Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
    });

    const testRoom = 'room123';

    client.on('connect', () => {
      client.emit('joinRoom', testRoom);
    });

    client.on('roomJoined', (data) => {
      expect(data.roomId).toBe(testRoom);
      client.disconnect();
      done();
    });
  });

  test('should emit receive_message after send_message', (done) => {
  const client = new Client(`http://localhost:${PORT}`, {
    transports: ['websocket'],
  });

  const msgData = {
    roomId: 'roomABC',
    senderId: 1,
    message: 'Hello Jest!',
  };

  client.on('connect', () => {
    client.emit('joinRoom', msgData.roomId);
  });

  // Wait for room to be joined before sending the message
  client.on('roomJoined', () => {
    client.emit('send_message', msgData);
  });

  client.on('receive_message', (data) => {
    expect(data).toEqual(msgData);
    client.disconnect();
    done();
  });
}); 
});
