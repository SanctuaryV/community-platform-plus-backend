const request = require('supertest');
const express = require('express');
const chatRoutes = require('./chat.routes');
const chatController = require('../controllers/chat.controller');

// Mock controller
jest.mock('../controllers/chat.controller', () => ({
  getFollowing: jest.fn(),
  getOrCreateRoom: jest.fn(),
  getMessages: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/', chatRoutes);

describe('Chat Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('POST /following returns following list', async () => {
    const mockFollowing = [{ id: 1, name: 'Alice' }];
    chatController.getFollowing.mockImplementation((req, res) =>
      res.status(200).json({ following: mockFollowing })
    );

    const res = await request(app).post('/following');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ following: mockFollowing });
  });

  test('POST /room returns or creates room', async () => {
    const mockRoom = { roomId: 5 };
    chatController.getOrCreateRoom.mockImplementation((req, res) =>
      res.status(201).json(mockRoom)
    );

    const res = await request(app).post('/room').send({ user1Id: 1, user2Id: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockRoom);
  });

  test('POST /messages returns messages', async () => {
    const mockMessages = [{ senderId: 1, message: 'Hello', roomId: 5 }];
    chatController.getMessages.mockImplementation((req, res) =>
      res.status(200).json({ messages: mockMessages })
    );

    const res = await request(app).post('/messages').send({ roomId: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ messages: mockMessages });
  });
});
