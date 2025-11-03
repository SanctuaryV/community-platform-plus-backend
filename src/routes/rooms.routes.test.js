const request = require('supertest');
const express = require('express');
const chatRoutes = require('./rooms.routes'); // adjust path if needed
const { createRoom, getRooms } = require('../sockets/chatSocket');

jest.mock('../sockets/chatSocket', () => ({
  createRoom: jest.fn(),
  getRooms: jest.fn(),
}));

jest.mock('../config/db.config', () => ({
  query: jest.fn(), // prevent real MySQL connection
}));

const app = express();
app.use(express.json());
app.use('/', chatRoutes);

describe('Chat Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rooms', () => {
    test('should return rooms list', async () => {
      const mockRooms = [
        { id: 1, user1_id: 1, user2_id: 2 },
        { id: 2, user1_id: 3, user2_id: 4 },
      ];
      getRooms.mockResolvedValue(mockRooms);

      const res = await request(app).get('/api/rooms');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockRooms);
      expect(getRooms).toHaveBeenCalledTimes(1);
    });

    test('should return 500 on error', async () => {
      getRooms.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/rooms');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Error fetching rooms' });
    });
  });

  describe('POST /api/rooms', () => {
    test('should create a new room successfully', async () => {
      const mockRoom = { roomId: 10 };
      createRoom.mockResolvedValue(mockRoom);

      const res = await request(app)
        .post('/api/rooms')
        .send({ user1Id: 1, user2Id: 2 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockRoom);
      expect(createRoom).toHaveBeenCalledWith(1, 2);
    });

    test('should return 500 on createRoom error', async () => {
      createRoom.mockRejectedValue(new Error('DB fail'));

      const res = await request(app)
        .post('/api/rooms')
        .send({ user1Id: 1, user2Id: 2 });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Error creating room' });
    });
  });
});
