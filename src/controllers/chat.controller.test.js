// __tests__/chat.controller.test.js
const {
  getFollowing,
  getOrCreateRoom,
  getMessages,
} = require('./chat.controller'); // update path
const connection = require('../config/db.config');

jest.mock('../config/db.config', () => ({
  query: jest.fn(),
  execute: jest.fn(),
}));

describe('Chat Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    connection.query.mockReset();
    connection.execute.mockReset();
  });

  // ================= getFollowing =================
  describe('getFollowing', () => {
    it('should return following list', () => {
      req.body.userId = 1;
      const mockRows = [{ userId: 2, name: 'Alice', avatarUrl: 'url' }];
      connection.query.mockImplementation((query, values, cb) => cb(null, mockRows));

      getFollowing(req, res);

      expect(connection.query).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRows);
    });

    it('should return 500 on db error', () => {
      req.body.userId = 1;
      connection.query.mockImplementation((q, values, cb) => cb(new Error('DB error'), null));

      getFollowing(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error fetching following list' });
    });
  });

  describe('getOrCreateRoom', () => {
    it('should return existing roomId if found', () => {
      req.body = { userId: 1, otherUserId: 2 };
      connection.query.mockImplementationOnce((q, values, cb) => cb(null, [{ room_id: 10 }]));

      getOrCreateRoom(req, res);

      expect(res.json).toHaveBeenCalledWith({ roomId: 10 });
    });

    it('should create new room if not exists', () => {
      req.body = { userId: 1, otherUserId: 2 };
      connection.query
        .mockImplementationOnce((q, values, cb) => cb(null, [])) // no existing room
        .mockImplementationOnce((q, values, cb) => cb(null, { insertId: 20 })); // create room

      getOrCreateRoom(req, res);

      expect(res.json).toHaveBeenCalledWith({ roomId: 20 });
    });

    it('should return 500 on query error', () => {
      req.body = { userId: 1, otherUserId: 2 };
      connection.query.mockImplementationOnce((q, values, cb) => cb(new Error('DB error')));

      getOrCreateRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database query error' });
    });

    it('should return 500 if room creation fails', () => {
      req.body = { userId: 1, otherUserId: 2 };
      connection.query
        .mockImplementationOnce((q, values, cb) => cb(null, [])) // no existing room
        .mockImplementationOnce((q, values, cb) => cb(new Error('Insert error')));

      getOrCreateRoom(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create room' });
    });
  });

  describe('getMessages', () => {
    it('should return messages with senderId as string', () => {
      req.body.roomId = 1;
      const mockResult = [
        { message_id: 1, sender_id: 2, content: 'Hello', timestamp: '2025-11-03' },
      ];
      connection.execute.mockImplementation((q, values, cb) => cb(null, mockResult));

      getMessages(req, res);

      expect(connection.execute).toHaveBeenCalledWith(expect.any(String), [1], expect.any(Function));
      expect(res.json).toHaveBeenCalledWith([
        { message_id: 1, content: 'Hello', timestamp: '2025-11-03', senderId: '2' },
      ]);
    });

    it('should return 500 on db error', () => {
      req.body.roomId = 1;
      connection.execute.mockImplementation((q, values, cb) => cb(new Error('DB error')));

      getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching messages' });
    });
  });
});
