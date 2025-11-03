const request = require('supertest');
const express = require('express');

// 1️⃣ Mock the communityController
jest.mock('../controllers/community.controller', () => ({
  getGroups: jest.fn(),
  createGroup: jest.fn(),
  deleteGroup: jest.fn(),
}));

jest.mock('../config/db.config', () => ({ query: jest.fn() }));

const communityController = require('../controllers/community.controller');
const communityRoutes = require('./community.routes');

const app = express();
app.use(express.json());
app.use('/', communityRoutes);

describe('Community Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // POST /getgroups
  describe('POST /getgroups', () => {
    it('should return groups', async () => {
      const mockGroups = [{ id: 1, name: 'Group 1' }];
      communityController.getGroups.mockImplementation((req, res) =>
        res.status(200).json({ groups: mockGroups })
      );

      const res = await request(app).post('/getgroups');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ groups: mockGroups });
      expect(communityController.getGroups).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      communityController.getGroups.mockImplementation((req, res) =>
        res.status(500).json({ message: 'Database error' })
      );

      const res = await request(app).post('/getgroups');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Database error' });
      expect(communityController.getGroups).toHaveBeenCalledTimes(1);
    });
  });

  // POST /creategroups
  describe('POST /creategroups', () => {
    it('should create a group', async () => {
      const mockGroup = { id: 2, name: 'New Group' };
      communityController.createGroup.mockImplementation((req, res) =>
        res.status(201).json(mockGroup)
      );

      const res = await request(app).post('/creategroups').send({ name: 'New Group' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockGroup);
      expect(communityController.createGroup).toHaveBeenCalledTimes(1);
    });
  });

  // POST /deletegroup
  describe('POST /deletegroup', () => {
    it('should delete a group', async () => {
      communityController.deleteGroup.mockImplementation((req, res) =>
        res.status(200).json({ message: 'Group deleted' })
      );

      const res = await request(app).post('/deletegroup').send({ groupId: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Group deleted' });
      expect(communityController.deleteGroup).toHaveBeenCalledTimes(1);
    });
  });
});
