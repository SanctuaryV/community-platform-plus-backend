// backend/src/sockets/userSocket.test.js
const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

const userSocketHandler = require('./userSocket');

let io, server, port;

beforeAll((done) => {
  const app = require('express')();
  server = http.createServer(app);
  io = new Server(server, {
    cors: { origin: '*' },
  });

  // Attach the socket handler when a client connects
  io.on('connection', (socket) => {
    userSocketHandler(io, socket);
  });

  // Listen on a random available port
  server.listen(0, () => {
    port = server.address().port;
    done();
  });
});

afterAll((done) => {
  io.close();
  server.close(done);
});

// Mock the DB connection
jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

describe('userSocket.js', () => {
  test('should respond with loginSuccess when userLogin is emitted', (done) => {
    const client = new Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    const mockUserData = { id: 1, name: 'Alice' };

    client.on('connect', () => {
      client.emit('userLogin', mockUserData);
    });

    client.on('loginSuccess', (data) => {
      expect(data).toEqual({ message: 'Welcome back!' });
      client.disconnect();
      done();
    });
  });

  test('should disconnect client when userLogout is emitted', (done) => {
    const client = new Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    const userId = 123;

    client.on('connect', () => {
      client.emit('userLogout', userId);
    });

    client.on('disconnect', (reason) => {
      expect(reason).toBe('io server disconnect'); // Expected disconnect reason
      done();
    });
  });
});
