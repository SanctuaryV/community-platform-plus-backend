// src/controllers/main.controller.test.js
const { mainPosts } = require('./main.controller');
const connection = require('../config/db.config');

describe('Main Controller', () => {
  beforeEach(() => {
    // Reset query mock
    connection.query = jest.fn();
  });

  it('should fetch posts with user info', async () => {
    const mockResults = [
      {
        post_id: 1,
        content: 'Hello World',
        image_url: 'http://localhost:3000/post/img.jpg',
        post_created_at: new Date('2025-11-03T11:10:00Z'),
        user_id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        avatar_url: 'http://localhost:3000/uploads/avatar.jpg',
      },
    ];

    connection.query.mockImplementation((query, callback) => {
      callback(null, mockResults);
    });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await mainPosts(req, res);

    expect(connection.query).toHaveBeenCalledWith(expect.any(String), expect.any(Function));
    expect(res.json).toHaveBeenCalledWith(mockResults);
  });

  it('should handle database errors', async () => {
    connection.query.mockImplementation((query, callback) => {
      callback(new Error('DB error'), null);
    });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await mainPosts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
  });
});
