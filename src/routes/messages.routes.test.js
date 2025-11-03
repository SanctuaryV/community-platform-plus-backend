const request = require('supertest');
const express = require('express');
const messagesRoutes = require('./messages.routes');
const messagesController = require('../controllers/messages.controller');

// Mock controller
jest.mock('../controllers/messages.controller', () => ({
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
}));

jest.mock('../config/db.config', () => ({ query: jest.fn() }));

const app = express();
app.use(express.json());
app.use('/', messagesRoutes);

describe('Messages Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /messages/:roomId returns messages', async () => {
    const mockMessages = [{ id: 1, roomId: 5, senderId: 1, message: 'Hello' }];
    messagesController.getMessages.mockImplementation((req, res) =>
      res.status(200).json(mockMessages)
    );

    const res = await request(app).get('/messages/5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockMessages);
  });

  test('POST /messages/:roomId sends message', async () => {
    const messageData = { senderId: 1, message: 'Hi' };
    const mockResponse = { id: 1, roomId: 5, ...messageData };

    messagesController.sendMessage.mockImplementation((req, res) =>
      res.status(201).json(mockResponse)
    );

    const res = await request(app).post('/messages/5').send(messageData);

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockResponse);
  });
});
