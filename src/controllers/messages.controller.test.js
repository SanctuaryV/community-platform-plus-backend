// src/controllers/messages.controller.test.js
const { getMessages, sendMessage } = require('./messages.controller');
const connection = require('../config/db.config');

jest.mock('../config/db.config'); // Mock the DB connection

describe('Messages Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages/:roomId', () => {
    it('should fetch messages', async () => {
      const mockMessages = [
        {
          id: 1,
          room_id: 1,
          sender_id: 1,
          message: 'Hello',
          timestamp: new Date('2025-11-03T11:09:33.241Z'),
        },
      ];

      // Mock DB execute
      connection.execute.mockImplementation((query, params, callback) => {
        callback(null, mockMessages);
      });

      // Mock Express req and res
      const req = {
        params: { roomId: '1' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getMessages(req, res);

      expect(connection.execute).toHaveBeenCalledWith(
        'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC',
        ['1'],
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith(mockMessages);
    });

    it('should handle DB errors', async () => {
      connection.execute.mockImplementation((query, params, callback) => {
        callback(new Error('DB error'), null);
      });

      const req = { params: { roomId: '1' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      await getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });
  });

  describe('POST /messages/:roomId', () => {
    it('should send a message', async () => {
      const mockInsertResult = { insertId: 1 };
      connection.execute.mockImplementation((query, params, callback) => {
        callback(null, mockInsertResult);
      });

      const req = {
        params: { roomId: '1' },
        body: { senderId: 1, message: 'Hello' },
        protocol: 'http',
        get: () => 'localhost:3000',
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const now = new Date();
      jest.spyOn(global, 'Date').mockImplementation(() => now);

      await sendMessage(req, res);

      expect(connection.execute).toHaveBeenCalledWith(
        'INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)',
        ['1', 1, 'Hello'],
        expect.any(Function)
      );

      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        roomId: '1',
        senderId: 1,
        message: 'Hello',
        timestamp: now,
      });

      jest.restoreAllMocks();
    });

    it('should handle DB errors when sending message', async () => {
      connection.execute.mockImplementation((query, params, callback) => {
        callback(new Error('DB error'), null);
      });

      const req = { params: { roomId: '1' }, body: { senderId: 1, message: 'Hi' } };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal Server Error');
    });
  });
});
