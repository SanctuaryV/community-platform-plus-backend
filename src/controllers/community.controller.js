const connection = require('../config/db.config'); // เชื่อมต่อกับฐานข้อมูล
const Logger = require('../utils/logger');

// ฟังก์ชันดึงข้อมูลกลุ่ม
exports.getGroups = (req, res) => {
  const { action } = req.body;
  Logger.apiStart('COMMUNITY', 'Get Groups', { action });

  if (action === 'fetch') {
    const query = 'SELECT * FROM `groups`';
    connection.query(query, (err, results) => {
      if (err) {
        Logger.error('COMMUNITY', 'Error fetching groups', err);
        return res.status(500).send('Error fetching groups');
      }
      Logger.success('COMMUNITY', `Fetched ${results.length} groups`);
      Logger.apiEnd('COMMUNITY', 'Get Groups');
      res.json(results);  // ส่งข้อมูลกลุ่มทั้งหมดกลับไป
    });
  } else {
    Logger.warn('COMMUNITY', 'Invalid action', { action });
    res.status(400).send('Invalid action');
  }
};

// ฟังก์ชันสร้างกลุ่มใหม่
exports.createGroup = (req, res) => {
  const { name, description, action } = req.body;
  Logger.apiStart('COMMUNITY', 'Create Group', { name, action });

  if (action === 'create') {
    if (!name || !description) {
      Logger.warn('COMMUNITY', 'Name and description are required');
      return res.status(400).send('Name and description are required');
    }

    const query = 'INSERT INTO `groups` (name, description) VALUES (?, ?)';
    connection.query(query, [name, description], (err, result) => {
      if (err) {
        Logger.error('COMMUNITY', 'Error creating group', err);
        return res.status(500).send('Error creating group');
      }

      const newGroup = {
        group_id: result.insertId,
        name,
        description,
      };
      Logger.success('COMMUNITY', 'Group created successfully', { group_id: result.insertId, name });
      Logger.apiEnd('COMMUNITY', 'Create Group');
      res.status(201).json(newGroup);  // ส่งข้อมูลกลุ่มที่สร้างใหม่กลับไป
    });
  } else {
    Logger.warn('COMMUNITY', 'Invalid action', { action });
    res.status(400).send('Invalid action');
  }
};

// ฟังก์ชันลบกลุ่ม
exports.deleteGroup = (req, res) => {
    const { groupId, action } = req.body;
    Logger.apiStart('COMMUNITY', 'Delete Group', { groupId, action });
  
    if (action === 'delete') {
      if (!groupId) {
        Logger.warn('COMMUNITY', 'Group ID is required');
        return res.status(400).send('Group ID is required');
      }
  
      const query = 'DELETE FROM `groups` WHERE group_id = ?';
      connection.query(query, [groupId], (err, result) => {
        if (err) {
          Logger.error('COMMUNITY', 'Error deleting group', err);
          return res.status(500).send('Error deleting group');
        }
  
        if (result.affectedRows === 0) {
          Logger.warn('COMMUNITY', 'Group not found', { groupId });
          return res.status(404).send('Group not found');
        }
  
        Logger.success('COMMUNITY', 'Group deleted successfully', { groupId });
        Logger.apiEnd('COMMUNITY', 'Delete Group');
        res.status(200).send('Group deleted successfully');
      });
    } else {
      Logger.warn('COMMUNITY', 'Invalid action', { action });
      res.status(400).send('Invalid action');
    }
  };
  