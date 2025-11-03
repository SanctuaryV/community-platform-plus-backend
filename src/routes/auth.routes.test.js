const express = require('express');
const request = require('supertest');

// Mock controllers
jest.mock('../controllers/auth.controller', () => ({
  register: jest.fn(),
  login: jest.fn(),
}));

// Mock middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => next()),
}));

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authRoutes = require('./auth.routes');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/', authRoutes);
  });

  test('POST /Register should call register controller', async () => {
    authController.register.mockImplementation((req, res) =>
      res.status(201).json({ message: 'Registered' })
    );

    const res = await request(app)
      .post('/Register')
      .send({ name: 'Alice', email: 'a@test.com', password: '123' });

    expect(authController.register).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Registered' });
  });

  test('POST /Login should call login controller', async () => {
    authController.login.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Logged in' })
    );

    const res = await request(app)
      .post('/Login')
      .send({ email: 'a@test.com', password: '123' });

    expect(authController.login).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged in' });
  });

  test('POST /authen should call middleware and proceed', async () => {
    const res = await request(app).post('/authen');
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
  });
});
