const request = require('supertest');
const express = require('express');

// Mock the post controller functions
jest.mock('../controllers/post.controller', () => ({
  getPosts: jest.fn(),
  createPost: jest.fn(),
  deletePost: jest.fn(),
  updatePost: jest.fn(),
  addComment: jest.fn(),
  addLike: jest.fn(),
  removeLike: jest.fn(),
}));

// Mock the DB connection
jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

const postController = require('../controllers/post.controller');
const postRoutes = require('./post.routes');

const app = express();
app.use(express.json());
app.use('/', postRoutes);

describe('Post Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:communityId', () => {
    test('should return posts', async () => {
      const mockPosts = [{ id: 1, title: 'Test Post' }];
      postController.getPosts.mockImplementation((req, res) => res.status(200).json(mockPosts));

      const res = await request(app).get('/123');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPosts);
      expect(postController.getPosts).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /createPost', () => {
    test('should create a new post', async () => {
      const newPost = { id: 2, title: 'New Post' };
      postController.createPost.mockImplementation((req, res) => res.status(201).json(newPost));

      const res = await request(app).post('/createPost').send({ title: 'New Post' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newPost);
      expect(postController.createPost).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /deletePost', () => {
    test('should delete a post', async () => {
      const response = { message: 'Deleted successfully' };
      postController.deletePost.mockImplementation((req, res) => res.status(200).json(response));

      const res = await request(app).post('/deletePost').send({ postId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(response);
      expect(postController.deletePost).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /updatePost', () => {
    test('should update a post', async () => {
      const updatedPost = { id: 1, title: 'Updated Post' };
      postController.updatePost.mockImplementation((req, res) => res.status(200).json(updatedPost));

      const res = await request(app).post('/updatePost').send({ postId: 1, title: 'Updated Post' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedPost);
      expect(postController.updatePost).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /addComment', () => {
    test('should add a comment', async () => {
      const comment = { id: 1, message: 'Nice post!' };
      postController.addComment.mockImplementation((req, res) => res.status(201).json(comment));

      const res = await request(app).post('/addComment').send({ postId: 1, message: 'Nice post!' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(comment);
      expect(postController.addComment).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /addLike', () => {
    test('should add a like', async () => {
      const response = { message: 'Like added' };
      postController.addLike.mockImplementation((req, res) => res.status(200).json(response));

      const res = await request(app).post('/addLike').send({ postId: 1, userId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(response);
      expect(postController.addLike).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /removeLike', () => {
    test('should remove a like', async () => {
      const response = { message: 'Like removed' };
      postController.removeLike.mockImplementation((req, res) => res.status(200).json(response));

      const res = await request(app).post('/removeLike').send({ postId: 1, userId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(response);
      expect(postController.removeLike).toHaveBeenCalledTimes(1);
    });
  });
});
