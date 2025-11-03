// src/routes/post.routes.test.js
const request = require('supertest');
const express = require('express');
const postController = require('../controllers/post.controller');
const connection = require('../config/db.config');
const multer = require('multer');
const fs = require('fs');

jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

jest.mock('fs');

const app = express();
app.use(express.json());

// Setup routes
app.get('/posts/:communityId', postController.getPosts);
app.post('/createPost', postController.createPost);
app.post('/deletePost', postController.deletePost);
app.post('/updatePost', postController.updatePost);
app.post('/addComment', postController.addComment);
app.post('/deleteComment', postController.deleteComment);
app.post('/addLike', postController.addLike);
app.post('/removeLike', postController.removeLike);

describe('Post Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /posts/:communityId should fetch posts', async () => {
    const mockPosts = [
      { id: 1, content: 'Hello', comments: null, avatar_url: 'avatar.jpg', image_url: 'image.jpg' }
    ];
    connection.query.mockImplementation((sql, params, cb) => cb(null, mockPosts));

    const res = await request(app).get('/posts/1');

    expect(res.status).toBe(200);
    expect(res.body[0].content).toBe('Hello');
    expect(connection.query).toHaveBeenCalledTimes(1);
  });

  test('POST /createPost should create post', async () => {
    connection.query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ user_id: 1, name: 'Alice', avatar_url: null }])) // check user
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ group_id: 1 }])) // check group
      .mockImplementationOnce((sql, params, cb) => cb(null, { insertId: 10 })); // insert post

    const res = await request(app)
      .post('/createPost')
      .send({ user_id: 1, group_id: 1, content: 'Test Post' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
  });

  test('POST /deletePost should delete post', async () => {
    connection.query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ image_url: null }])) // get post
      .mockImplementationOnce((sql, params, cb) => cb(null, { affectedRows: 1 })); // delete post

    const res = await request(app).post('/deletePost').send({ post_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post deleted successfully');
  });

  test('POST /updatePost should update post', async () => {
    connection.query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ user_id: 1, image_url: null }])) // get post
      .mockImplementationOnce((sql, params, cb) => cb(null, {})); // update post

    const res = await request(app)
      .post('/updatePost')
      .send({ post_id: 1, user_id: 1, content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post updated successfully');
  });

  test('POST /addComment should add comment', async () => {
    connection.query.mockImplementation((sql, params, cb) => cb(null, { insertId: 5 }));

    const res = await request(app)
      .post('/addComment')
      .send({ post_id: 1, user_id: 1, content: 'Nice post', avatar_url: null });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(5);
  });

  test('POST /deleteComment should delete comment', async () => {
    connection.query
      .mockImplementationOnce((sql, params, cb) => cb(null, [{ user_id: 1 }])) // get comment
      .mockImplementationOnce((sql, params, cb) => cb(null, {})); // delete comment

    const res = await request(app).post('/deleteComment').send({ comment_id: 1, user_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment deleted successfully');
  });

  test('POST /addLike should add like', async () => {
    connection.query
      .mockImplementationOnce((sql, params, cb) => cb(null, [])) // check like
      .mockImplementationOnce((sql, params, cb) => cb(null, {})); // insert like

    const res = await request(app).post('/addLike').send({ post_id: 1, user_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Like added successfully');
  });

  test('POST /removeLike should remove like', async () => {
    connection.query.mockImplementation((sql, params, cb) => cb(null, { affectedRows: 1 }));

    const res = await request(app).post('/removeLike').send({ post_id: 1, user_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Like removed successfully');
  });
});
