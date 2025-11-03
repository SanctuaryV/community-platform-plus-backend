// __tests__/auth.controller.test.js
const { register, login } = require('./auth.controller'); // update path
const connection = require('../config/db.config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../config/db.config', () => ({
  execute: jest.fn(),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
    };
    connection.execute.mockReset();
    bcrypt.hash.mockReset();
    bcrypt.compare.mockReset();
    jwt.sign.mockReset();
  });

  describe('register', () => {
    it('should register a new user successfully', () => {
      req.body = { name: 'Alice', email: 'alice@test.com', password: 'pass123' };

      bcrypt.hash.mockImplementation((password, salt, cb) => cb(null, 'hashedPass'));
      connection.execute.mockImplementation((query, values, cb) => cb(null, {}, null));

      register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10, expect.any(Function));
      expect(connection.execute).toHaveBeenCalledWith(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Alice', 'alice@test.com', 'hashedPass'],
        expect.any(Function)
      );
      expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
    });

    it('should return error if bcrypt fails', () => {
      req.body = { name: 'Alice', email: 'alice@test.com', password: 'pass123' };
      bcrypt.hash.mockImplementation((password, salt, cb) => cb('hash error', null));

      register(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'hash error' });
    });

    it('should return error if DB fails', () => {
      req.body = { name: 'Alice', email: 'alice@test.com', password: 'pass123' };
      bcrypt.hash.mockImplementation((password, salt, cb) => cb(null, 'hashedPass'));
      connection.execute.mockImplementation((query, values, cb) => cb('DB error', null, null));

      register(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'DB error' });
    });
  });

  describe('login', () => {
    it('should login successfully', () => {
      req.body = { email: 'alice@test.com', password: 'pass123' };
      const mockUser = [{
        user_id: 1,
        email: 'alice@test.com',
        password: 'hashedPass',
        created_at: '2025-11-03',
        avatar_url: 'avatar.png',
        name: 'Alice',
      }];

      connection.execute.mockImplementation((query, values, cb) => cb(null, mockUser));
      bcrypt.compare.mockImplementation((plain, hash, cb) => cb(null, true));
      jwt.sign.mockReturnValue('token123');

      login(req, res);

      expect(connection.execute).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email=?',
        ['alice@test.com'],
        expect.any(Function)
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('pass123', 'hashedPass', expect.any(Function));
      expect(jwt.sign).toHaveBeenCalledWith({ email: 'alice@test.com' }, 'token-for-join', { expiresIn: '1h' });
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: 'login success',
        token: 'token123',
        id_user: 1,
        email: 'alice@test.com',
        created: '2025-11-03',
        avatar_url: 'avatar.png',
        name: 'Alice',
      });
    });

    it('should return error if user not found', () => {
      req.body = { email: 'unknown@test.com', password: 'pass123' };
      connection.execute.mockImplementation((query, values, cb) => cb(null, []));

      login(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'no user found' });
    });

    it('should return error if password is wrong', () => {
      req.body = { email: 'alice@test.com', password: 'wrongpass' };
      const mockUser = [{ password: 'hashedPass' }];

      connection.execute.mockImplementation((query, values, cb) => cb(null, mockUser));
      bcrypt.compare.mockImplementation((plain, hash, cb) => cb(null, false));

      login(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'wrong password' });
    });

    it('should return error if DB query fails', () => {
      req.body = { email: 'alice@test.com', password: 'pass123' };
      connection.execute.mockImplementation((query, values, cb) => cb('DB error'));

      login(req, res);

      expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'DB error' });
    });
  });
});
