// backend/src/sockets/chatSocket.test.js
const { createRoom, sendMessage, getRooms } = require('./chatSocket');
const connection = require('../config/db.config');

// Mock the DB connection
jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

// Mock global io for socket emission
global.io = {
  to: jest.fn(() => ({
    emit: jest.fn(),
  })),
};

describe('chatSocket.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    test('should resolve with existing room if found', async () => {
      const mockRoom = { id: 1, user1_id: 1, user2_id: 2 };
      connection.query.mockImplementation((query, params, callback) => {
        if (query.includes('SELECT')) callback(null, [mockRoom]);
      });

      const result = await createRoom(1, 2);
      expect(result).toEqual(mockRoom);
      expect(connection.query).toHaveBeenCalledTimes(1);
    });

    test('should create a new room if none exists', async () => {
      connection.query
        .mockImplementationOnce((query, params, callback) => callback(null, [])) // no existing room
        .mockImplementationOnce((query, params, callback) =>
          callback(null, { insertId: 99 })
        );

      const result = await createRoom(1, 2);
      expect(result).toEqual({ roomId: 99 });
      expect(connection.query).toHaveBeenCalledTimes(2);
    });

    test('should reject on database error', async () => {
      connection.query.mockImplementation((query, params, callback) => {
        callback(new Error('DB error'));
      });

      await expect(createRoom(1, 2)).rejects.toThrow('DB error');
    });
  });

  describe('sendMessage', () => {
     test('should insert message and emit to socket room', async () => {
     const mockEmit = jest.fn();          // shared instance
     global.io = {
    to: jest.fn(() => ({ emit: mockEmit })),
    };

    const mockResults = { affectedRows: 1 };
    connection.query.mockImplementation((query, params, callback) => {
      callback(null, mockResults);
    });

    const roomId = 5, senderId = 1, message = 'hello';
    const result = await sendMessage(roomId, senderId, message);

    expect(result).toEqual(mockResults);
    expect(connection.query).toHaveBeenCalledTimes(1);
    expect(global.io.to).toHaveBeenCalledWith(roomId);
    expect(mockEmit).toHaveBeenCalledWith(
      'receive_message',
      expect.objectContaining({ senderId, message, roomId })
    );
  });

    test('should reject on database error', async () => {
      connection.query.mockImplementation((q, p, cb) => cb(new Error('DB fail')));
      await expect(sendMessage(1, 2, 'msg')).rejects.toThrow('DB fail');
    });
  });

  describe('getRooms', () => {
    test('should resolve with all rooms', async () => {
      const mockRooms = [{ id: 1 }, { id: 2 }];
      connection.query.mockImplementation((q, cb) => cb(null, mockRooms));

      const result = await getRooms();
      expect(result).toEqual(mockRooms);
    });

    test('should reject on database error', async () => {
      connection.query.mockImplementation((q, cb) => cb(new Error('Query fail')));
      await expect(getRooms()).rejects.toThrow('Query fail');
    });
  });
});
