// __tests__/groups.test.js
const { getGroups, createGroup, deleteGroup } = require('./community.controller'); // update path
const connection = require('../config/db.config');

jest.mock('../config/db.config', () => ({
  query: jest.fn(),
}));

describe('Groups API', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    connection.query.mockReset();
  });

  describe('getGroups', () => {
    it('should fetch all groups', () => {
      req.body.action = 'fetch';
      const mockResults = [{ group_id: 1, name: 'Test', description: 'Desc' }];
      connection.query.mockImplementation((query, cb) => cb(null, mockResults));

      getGroups(req, res);

      expect(connection.query).toHaveBeenCalledWith('SELECT * FROM `groups`', expect.any(Function));
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    it('should return 500 on db error', () => {
      req.body.action = 'fetch';
      connection.query.mockImplementation((query, cb) => cb(new Error('DB error'), null));

      getGroups(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error fetching groups');
    });

    it('should return 400 for invalid action', () => {
      req.body.action = 'invalid';
      getGroups(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid action');
    });
  });

  describe('createGroup', () => {
    it('should create a new group', () => {
      req.body = { action: 'create', name: 'New', description: 'Desc' };
      connection.query.mockImplementation((query, values, cb) =>
        cb(null, { insertId: 123 })
      );

      createGroup(req, res);

      expect(connection.query).toHaveBeenCalledWith(
        'INSERT INTO `groups` (name, description) VALUES (?, ?)',
        ['New', 'Desc'],
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        group_id: 123,
        name: 'New',
        description: 'Desc',
      });
    });

    it('should return 400 if name or description missing', () => {
      req.body = { action: 'create', name: 'New' };

      createGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Name and description are required');
    });

    it('should return 500 on db error', () => {
      req.body = { action: 'create', name: 'New', description: 'Desc' };
      connection.query.mockImplementation((query, values, cb) => cb(new Error('DB error'), null));

      createGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error creating group');
    });

    it('should return 400 for invalid action', () => {
      req.body = { action: 'invalid', name: 'New', description: 'Desc' };

      createGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid action');
    });
  });


  describe('deleteGroup', () => {
    it('should delete a group successfully', () => {
      req.body = { action: 'delete', groupId: 1 };
      connection.query.mockImplementation((query, values, cb) =>
        cb(null, { affectedRows: 1 })
      );

      deleteGroup(req, res);

      expect(connection.query).toHaveBeenCalledWith(
        'DELETE FROM `groups` WHERE group_id = ?',
        [1],
        expect.any(Function)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('Group deleted successfully');
    });

    it('should return 404 if group not found', () => {
      req.body = { action: 'delete', groupId: 999 };
      connection.query.mockImplementation((query, values, cb) =>
        cb(null, { affectedRows: 0 })
      );

      deleteGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Group not found');
    });

    it('should return 500 on db error', () => {
      req.body = { action: 'delete', groupId: 1 };
      connection.query.mockImplementation((query, values, cb) => cb(new Error('DB error'), null));

      deleteGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error deleting group');
    });

    it('should return 400 for invalid action', () => {
      req.body = { action: 'invalid', groupId: 1 };

      deleteGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid action');
    });

    it('should return 400 if groupId missing', () => {
      req.body = { action: 'delete' };

      deleteGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Group ID is required');
    });
  });
});
