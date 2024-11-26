const connection = require('../config/db.config'); // เชื่อมต่อกับฐานข้อมูล

// ฟังก์ชันดึงข้อมูลกลุ่ม
exports.getGroups = (req, res) => {
  const { action } = req.body;

  if (action === 'fetch') {
    const query = 'SELECT * FROM `groups`';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching groups:', err);
        return res.status(500).send('Error fetching groups');
      }
      res.json(results);  // ส่งข้อมูลกลุ่มทั้งหมดกลับไป
    });
  } else {
    res.status(400).send('Invalid action');
  }
};

// ฟังก์ชันสร้างกลุ่มใหม่
exports.createGroup = (req, res) => {
  const { name, description, action } = req.body;

  if (action === 'create') {
    if (!name || !description) {
      return res.status(400).send('Name and description are required');
    }

    const query = 'INSERT INTO `groups` (name, description) VALUES (?, ?)';
    connection.query(query, [name, description], (err, result) => {
      if (err) {
        console.error('Error creating group:', err);
        return res.status(500).send('Error creating group');
      }

      const newGroup = {
        group_id: result.insertId,
        name,
        description,
      };
      res.status(201).json(newGroup);  // ส่งข้อมูลกลุ่มที่สร้างใหม่กลับไป
    });
  } else {
    res.status(400).send('Invalid action');
  }
};

// ฟังก์ชันลบกลุ่ม
exports.deleteGroup = (req, res) => {
    const { groupId, action } = req.body;
  
    if (action === 'delete') {
      if (!groupId) {
        return res.status(400).send('Group ID is required');
      }
  
      const query = 'DELETE FROM `groups` WHERE group_id = ?';
      connection.query(query, [groupId], (err, result) => {
        if (err) {
          console.error('Error deleting group:', err);
          return res.status(500).send('Error deleting group');
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).send('Group not found');
        }
  
        res.status(200).send('Group deleted successfully');
      });
    } else {
      res.status(400).send('Invalid action');
    }
  };
  