const request = require('supertest');
const express = require('express');
const profileRoutes = require('./profile.routes');
const profileController = require('../controllers/profile.controller');

// Mock controller
jest.mock('../controllers/profile.controller', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  getAllUsers: jest.fn(),
  followUser: jest.fn(),
  unfollowUser: jest.fn(),
}));

// Mock DB connection
jest.mock('../config/db.config', () => ({ query: jest.fn() }));

const app = express();
app.use(express.json());
app.use('/', profileRoutes);

describe('Profile Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /profile/:userId returns profile', async () => {
    const mockProfile = { id: 1, name: 'Alice' };
    profileController.getUserProfile.mockImplementation((req, res) =>
      res.status(200).json(mockProfile)
    );

    const res = await request(app).get('/profile/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProfile);
  });

  test('PUT /edit-profile/:userId updates profile', async () => {
    const updatedProfile = { id: 1, name: 'Bob' };
    profileController.updateUserProfile.mockImplementation((req, res) =>
      res.status(200).json(updatedProfile)
    );

    const res = await request(app)
      .put('/edit-profile/1')
      .send({ name: 'Bob' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedProfile);
  });

  test('POST /users returns all users', async () => {
    const users = [{ id: 1 }, { id: 2 }];
    profileController.getAllUsers.mockImplementation((req, res) =>
      res.status(200).json(users)
    );

    const res = await request(app).post('/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
  });

  test('POST /follow/:userId follows user', async () => {
    profileController.followUser.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Followed successfully' })
    );

    const res = await request(app).post('/follow/2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Followed successfully' });
  });

  test('POST /unfollow/:userId unfollows user', async () => {
    profileController.unfollowUser.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Unfollowed successfully' })
    );

    const res = await request(app).post('/unfollow/2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Unfollowed successfully' });
  });
});
