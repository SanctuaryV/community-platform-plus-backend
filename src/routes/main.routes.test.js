const request = require('supertest');
const express = require('express');

// Mock the mainController
jest.mock('../controllers/main.controller', () => ({
  mainPosts: jest.fn(),
}));

// Mock the DB connection
jest.mock('../config/db.config', () => ({ query: jest.fn() }));

const mainController = require('../controllers/main.controller');
const mainRoutes = require('./main.routes');

const app = express();
app.use(express.json());
app.use('/', mainRoutes);

describe('Main Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /main', () => {
    test('should return main posts', async () => {
      const mockPosts = [
        { id: 1, title: 'First post' },
        { id: 2, title: 'Second post' },
      ];

      mainController.mainPosts.mockImplementation((req, res) =>
        res.status(200).json({ posts: mockPosts })
      );

      const res = await request(app).post('/main');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ posts: mockPosts });
      expect(mainController.mainPosts).toHaveBeenCalledTimes(1);
    });

    test('should handle errors', async () => {
      mainController.mainPosts.mockImplementation((req, res) =>
        res.status(500).json({ message: 'Database error' })
      );

      const res = await request(app).post('/main');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Database error' });
    });
  });
});
