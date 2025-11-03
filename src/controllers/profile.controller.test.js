// src/routes/profile.routes.test.js
const request = require('supertest');
const express = require('express');
const profileController = require('../controllers/profile.controller');
const connection = require('../config/db.config'); // mock this

jest.mock('../config/db.config', () => ({
  execute: jest.fn(),
}));

const app = express();
app.use(express.json());

// Setup routes using the controller
app.get('/profile/:userId', profileController.getUserProfile);
app.put('/edit-profile/:userId', profileController._handleUpdateUserProfile || profileController.updateUserProfile[1]);
app.post('/users', profileController.getAllUsers);
app.post('/follow/:userId', profileController.followUser);
app.post('/unfollow/:userId', profileController.unfollowUser);

describe('Profile Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /profile/:userId should return user profile', async () => {
    const mockUser = [{
      user_id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      avatar_url: null,
      created_at: new Date(),
      age: 25,
      occupation: 'Engineer',
      bio: 'Hello',
      posts_count: 3,
      followers_count: 2,
      following_count: 1,
      comments_count: 5,
      followers_ids: '2,3',
      following_ids: '4'
    }];

    connection.execute.mockImplementation((sql, params, cb) => cb(null, mockUser));

    const res = await request(app).get('/profile/1');

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.followers_ids).toEqual(['2','3']);
    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  test('GET /users should return all users', async () => {
    const mockUsers = [{ user_id: 1, name: 'Alice' }, { user_id: 2, name: 'Bob' }];
    connection.execute.mockImplementation((sql, cb) => cb(null, mockUsers));

    const res = await request(app).post('/users').send({});

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(2);
  });

  test('PUT /edit-profile/:userId should update profile', async () => {
    // Mock DB responses for old avatar check and update
    connection.execute
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ avatar_url: null }])) // old avatar
      .mockImplementationOnce((sql, values, cb) => cb(null, { affectedRows: 1 })); // update

    const res = await request(app)
      .put('/edit-profile/1')
      .send({ name: 'Alice Updated', email: 'alice@new.com', age: 26, occupation: 'Dev', bio: 'Updated bio' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
  });

  test('POST /follow/:userId should follow a user', async () => {
    connection.execute
      .mockImplementationOnce((sql, params, cb) => cb(null, [])) // check follow
      .mockImplementationOnce((sql, params, cb) => cb(null, {})) // insert follow
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ user_id: 2, name: 'Bob' }])); // fetch followers

    const res = await request(app)
      .post('/follow/2')
      .send({ followerId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.followers.length).toBe(1);
  });

  test('POST /unfollow/:userId should unfollow a user', async () => {
    connection.execute
      .mockImplementationOnce((sql, params, cb) => cb(null, [{}])) // check follow exists
      .mockImplementationOnce((sql, params, cb) => cb(null, {})) // delete follow
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ user_id: 3, name: 'Charlie' }])); // fetch followers

    const res = await request(app)
      .post('/unfollow/3')
      .send({ followerId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.followers.length).toBe(1);
  });

});
