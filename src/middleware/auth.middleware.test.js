// src/routes/auth.routes.test.js
const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth.routes');
const authMiddleware = require('../middleware/auth.middleware');

// Mock the authenticate middleware
jest.mock('../middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, res) => res.status(200).json({ message: 'Authenticated' })),
}));

// Mock the DB config to prevent real MySQL connection
jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mount the router at root
    app.use('/', authRoutes);

    // Optional: debug registered routes
    console.log(
      'Registered routes:',
      app._router.stack
        .filter(r => r.route)
        .map(r => ({ path: r.route.path, methods: r.route.methods }))
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /authen should call authenticate middleware and respond', async () => {
    const res = await request(app).post('/authen');

    // Check that the mocked middleware was called
    expect(authMiddleware.authenticate).toHaveBeenCalledTimes(1);

    // Check response
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Authenticated' });
  });
});
