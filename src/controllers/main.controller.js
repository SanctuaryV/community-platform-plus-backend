const connection = require('../config/db.config');
const Logger = require('../utils/logger');

// ฟังก์ชันดึงข้อมูลโพสต์พร้อมข้อมูลของผู้ใช้
exports.mainPosts = (req, res) => {
  Logger.apiStart('MAIN', 'Get Main Posts');
  
  const query = `
    SELECT 
      p.id AS post_id, 
      p.content, 
      p.image_url, 
      p.created_at AS post_created_at, 
      u.user_id, 
      u.name, 
      u.email, 
      u.avatar_url
    FROM 
      posts p
    JOIN 
      users u ON p.user_id = u.user_id
    ORDER BY 
      p.created_at DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      Logger.error('MAIN', 'Error fetching posts', err);
      return res.status(500).json({ error: 'Database error' });
    }
    Logger.success('MAIN', `Fetched ${results.length} posts`, { count: results.length });
    Logger.apiEnd('MAIN', 'Get Main Posts');
    res.json(results); // ส่งข้อมูลโพสต์และผู้ใช้ไปที่ frontend
  });
};
