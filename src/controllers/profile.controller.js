// backend/src/controllers/profile.controller.js
const connection = require('../config/db.config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Logger = require('../utils/logger');

// ตรวจสอบว่าไฟล์ที่อัปโหลดอยู่ในโฟลเดอร์ uploads หรือไม่
fs.readdir(path.join(__dirname, '../..', 'uploads'), (err, files) => {
  if (err) {
    console.error("Error reading uploads folder:", err); // แสดงเฉพาะข้อผิดพลาด
  }
});

// ตั้งค่าการเก็บไฟล์ที่อัปโหลด
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // กำหนดโฟลเดอร์สำหรับเก็บไฟล์
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // ตั้งชื่อไฟล์
  }
});

const fileFilter = (req, file, cb) => {
  // กรองไฟล์ที่อนุญาตให้มีนามสกุล .jpg และ .png เท่านั้น
  const fileTypes = /jpg|jpeg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // อนุญาตให้ไฟล์
  } else {
    return cb(new Error('Only .jpg, .jpeg, and .png files are allowed'), false); // ไม่อนุญาตให้ไฟล์
  }
};

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true); // อนุญาตให้ไฟล์
    } else {
      console.log('Invalid file type:', file.originalname); // พิมพ์เมื่อไฟล์ไม่ตรงตามประเภทที่อนุญาต
      return cb(new Error('Only .jpg, .jpeg, and .png files are allowed'), false); // ส่งข้อผิดพลาด
    }
  }
});

exports.getUserProfile = (req, res) => {
  const userId = req.params.userId; // ดึง userId จาก params
  Logger.apiStart('PROFILE', 'Get User Profile', { userId });

  const sql = `
    SELECT 
      u.user_id, 
      u.name, 
      u.email, 
      u.avatar_url, 
      u.created_at, 
      u.age,                    
      u.occupation,             
      u.bio,                    
      COUNT(DISTINCT p.id) AS posts_count,
      COUNT(DISTINCT f1.id) AS followers_count,
      COUNT(DISTINCT f2.id) AS following_count,
      COUNT(DISTINCT c.id) AS comments_count,
      GROUP_CONCAT(DISTINCT f1.follower_id) AS followers_ids,  -- รายชื่อผู้ที่ติดตาม
      GROUP_CONCAT(DISTINCT f2.followed_id) AS following_ids   -- รายชื่อผู้ที่ผู้ใช้กำลังติดตาม
    FROM 
      users u
    LEFT JOIN posts p ON u.user_id = p.user_id
    LEFT JOIN followers f1 ON u.user_id = f1.followed_id
    LEFT JOIN followers f2 ON u.user_id = f2.follower_id
    LEFT JOIN comments c ON p.id = c.post_id
    WHERE u.user_id = ?
    GROUP BY u.user_id;
  `;

  connection.execute(sql, [userId], (err, results) => {
    if (err) {
      Logger.error('PROFILE', 'Database error fetching user profile', err);
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      Logger.warn('PROFILE', 'User not found', { userId });
      return res.status(404).json({ message: 'User not found' });
    }
    
    Logger.success('PROFILE', 'User profile fetched successfully', { userId, name: results[0].name });

    const userProfile = results[0];

    // แปลงรายชื่อผู้ติดตามและผู้ที่กำลังติดตามจาก ID เป็นอาเรย์
    const followersIds = userProfile.followers_ids ? userProfile.followers_ids.split(',') : [];
    const followingIds = userProfile.following_ids ? userProfile.following_ids.split(',') : [];

    // ส่งข้อมูลโปรไฟล์ผู้ใช้พร้อมกับ followersIds และ followingIds
    return res.status(200).json({
      status: 'ok',
      message: 'User profile fetched',
      user: {
        ...userProfile,
        followers_ids: followersIds, // รายชื่อผู้ติดตาม
        following_ids: followingIds   // รายชื่อผู้ที่กำลังติดตาม
      }
    });
  });
};




exports.getAllUsers = (req, res) => {
  const { filter } = req.body; // หากต้องการใช้ตัวกรอง

  // เพิ่มการตรวจสอบ filter หรือข้อมูลที่ส่งเข้ามา
  if (filter && filter.someValue === undefined) {
    filter.someValue = null; // เปลี่ยน undefined ให้เป็น null
  }

  const sql = `
      SELECT 
        u.user_id, 
        u.name, 
        u.email, 
        u.avatar_url, 
        u.created_at, 
        COUNT(DISTINCT p.id) AS posts_count,
        COUNT(DISTINCT f1.id) AS followers_count,
        COUNT(DISTINCT f2.id) AS following_count,
        COUNT(DISTINCT c.id) AS comments_count
      FROM 
        users u
      LEFT JOIN posts p ON u.user_id = p.user_id
      LEFT JOIN followers f1 ON u.user_id = f1.followed_id
      LEFT JOIN followers f2 ON u.user_id = f2.follower_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY u.user_id;
    `;

  connection.execute(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    return res.status(200).json({ status: 'ok', message: 'All users fetched', users: results });
  });
};

// ฟังก์ชันสำหรับอัปเดตโปรไฟล์
exports.updateUserProfile = [
  upload.single('avatar'), // ใช้ upload.single('avatar') ในการรับไฟล์
  (req, res) => {
    console.log('Received file:', req.file); // พิมพ์ข้อมูลของไฟล์ที่ได้รับ

    const { userId } = req.params;
    const { name, email, age, occupation, bio } = req.body;

    // 1. ดึงข้อมูลโปรไฟล์เก่าจากฐานข้อมูลเพื่อหาค่าของ avatar_url เก่า
    const sqlOldAvatar = 'SELECT avatar_url FROM users WHERE user_id = ?';
    
    connection.execute(sqlOldAvatar, [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error while fetching old avatar', error: err });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const oldAvatar = results[0].avatar_url; // ไฟล์โปรไฟล์เก่าที่เก็บในฐานข้อมูล

      // 2. ลบรูปเก่าถ้ามี (ถ้าเก็บเป็น URL ให้ใช้เฉพาะชื่อไฟล์)
      if (oldAvatar) {
        try {
          const oldFilename = path.basename(String(oldAvatar).split('?')[0]);
          const oldAvatarPath = path.join(__dirname, '../..', 'uploads', oldFilename);
          console.log('Old Avatar Path:', oldAvatarPath);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath); // ลบไฟล์รูปเก่า
            console.log('Old avatar deleted');
          } else {
            console.log('Old avatar file does not exist at', oldAvatarPath);
          }
        } catch (e) {
          console.log('Error resolving old avatar path:', e);
        }
      }

      // 3. อัปเดตโปรไฟล์ใหม่
  const avatar = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null; // URL ของไฟล์ที่อัปโหลด (dynamic host)

      const sql = `
        UPDATE users 
        SET 
          name = ?, 
          email = ?, 
          age = ?, 
          occupation = ?, 
          bio = ?, 
          avatar_url = ? 
        WHERE user_id = ?;
      `;

      const values = [name, email, age, occupation, bio, avatar, userId];

      connection.execute(sql, values, (err, result) => {
        if (err) {
          console.log("Database error:", err); // พิมพ์ข้อผิดพลาดของฐานข้อมูล
          return res.status(500).json({ message: 'Database error', error: err });
        }

        if (result.affectedRows === 0) {
          console.log("User not found"); // พิมพ์หากไม่พบผู้ใช้
          return res.status(404).json({ message: 'User not found' });
        }

        console.log("Profile updated successfully"); // พิมพ์เมื่อโปรไฟล์อัปเดตสำเร็จ
        return res.status(200).json({ status: 'ok', message: 'Profile updated successfully' });
      });
    });
  }
];

exports.followUser = (req, res) => {
  const followerId = req.body.followerId; // user ที่จะทำการติดตาม
  const followedId = req.params.userId; // user ที่จะถูกติดตาม

  // ตรวจสอบว่าไม่สามารถติดตามตัวเอง
  if (followerId === followedId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  // ตรวจสอบว่าผู้ใช้ได้ติดตามคนนี้แล้วหรือไม่
  const checkFollowSql = `
    SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?;
  `;
  connection.execute(checkFollowSql, [followerId, followedId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error while checking follow status', error: err });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // ถ้ายังไม่เคยติดตาม ให้เพิ่มการติดตาม
    const followSql = `
      INSERT INTO followers (follower_id, followed_id) 
      VALUES (?, ?);
    `;
    connection.execute(followSql, [followerId, followedId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error while following user', error: err });
      }

      // หลังจากติดตามสำเร็จ ดึงข้อมูลของผู้ติดตาม
      const followersSql = `
        SELECT u.user_id, u.name, u.avatar_url
        FROM users u
        JOIN followers f ON u.user_id = f.follower_id
        WHERE f.followed_id = ?;
      `;
      connection.execute(followersSql, [followedId], (err, followers) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching followers', error: err });
        }

        // ส่งข้อมูลการติดตามและผู้ติดตามที่เกี่ยวข้อง
        return res.status(200).json({ 
          status: 'ok', 
          message: 'User followed successfully',
          followers: followers // ส่งข้อมูลผู้ติดตาม
        });
      });
    });
  });
};

// ฟังก์ชันสำหรับยกเลิกการติดตาม (Unfollow)
exports.unfollowUser = (req, res) => {
  const followerId = req.body.followerId; // user ที่จะยกเลิกการติดตาม
  const followedId = req.params.userId; // user ที่จะถูกยกเลิกการติดตาม

  // ตรวจสอบว่าไม่สามารถยกเลิกการติดตามตัวเอง
  if (followerId === followedId) {
    return res.status(400).json({ message: 'You cannot unfollow yourself' });
  }

  // ตรวจสอบว่าผู้ใช้เคยติดตามคนนี้หรือไม่
  const checkFollowSql = `
    SELECT * FROM followers WHERE follower_id = ? AND followed_id = ?;
  `;
  connection.execute(checkFollowSql, [followerId, followedId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error while checking follow status', error: err });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // ถ้ามีการติดตาม ให้ทำการยกเลิกการติดตาม
    const unfollowSql = `
      DELETE FROM followers WHERE follower_id = ? AND followed_id = ?;
    `;
    connection.execute(unfollowSql, [followerId, followedId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error while unfollowing user', error: err });
      }

      // หลังจากยกเลิกการติดตามสำเร็จ ดึงข้อมูลของผู้ติดตาม
      const followersSql = `
        SELECT u.user_id, u.name, u.avatar_url
        FROM users u
        JOIN followers f ON u.user_id = f.follower_id
        WHERE f.followed_id = ?;
      `;
      connection.execute(followersSql, [followedId], (err, followers) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching followers', error: err });
        }

        // ส่งข้อมูลการยกเลิกการติดตามและผู้ติดตามที่เกี่ยวข้อง
        return res.status(200).json({ 
          status: 'ok', 
          message: 'User unfollowed successfully',
          followers: followers // ส่งข้อมูลผู้ติดตามที่อัปเดต
        });
      });
    });
  });
};
