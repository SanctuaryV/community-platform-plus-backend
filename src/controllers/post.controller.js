const connection = require('../config/db.config'); // เชื่อมต่อกับฐานข้อมูล
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

// ตั้งค่า Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'post/'); // โฟลเดอร์สำหรับเก็บรูปภาพ
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
    }
});

const upload = multer({ storage });

// ฟังก์ชันสำหรับดึงโพสต์
exports.getPosts = (req, res) => {
    const communityId = req.params.communityId;
    Logger.apiStart('POST', 'Get Posts', { communityId });
    
    const query = `
        SELECT posts.*, 
               users.avatar_url AS avatar_url, 
               users.name, 
               (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS like_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count,
               GROUP_CONCAT(
                   IF(
                       comments.id IS NOT NULL,
                       JSON_OBJECT(
                           'comment_id', comments.id,
                           'user_id', comments.user_id,
                           'content', comments.content,
                           'created_at', comments.created_at,
                           'avatar_url', comments.avatar_url
                       ),
                       NULL
                   ) ORDER BY comments.created_at DESC
               ) AS comments
        FROM posts
        JOIN users ON posts.user_id = users.user_id
        LEFT JOIN comments ON comments.post_id = posts.id
        WHERE posts.group_id = ?
        GROUP BY posts.id
        ORDER BY posts.created_at DESC
    `;
  
    connection.query(query, [communityId], (err, results) => {
        if (err) {
            Logger.error('POST', 'Error fetching posts', err);
            return res.status(500).json({ message: 'Error fetching posts', error: err });
        }
        
        Logger.success('POST', `Fetched ${results.length} posts`, { communityId, count: results.length });
        
        // เปลี่ยนคอมเมนต์จาก JSON string กลับเป็นอาร์เรย์ว่างหากไม่มีคอมเมนต์
        results.forEach(post => {
            if (post.comments) {
                post.comments = JSON.parse('[' + post.comments + ']');
            } else {
                post.comments = []; // ถ้าไม่มีคอมเมนต์ ให้ตั้งเป็นอาร์เรย์ว่าง
            }

            // Normalize avatar_url: if it's a filename or relative path, prefix with host
            if (post.avatar_url && !/^https?:\/\//i.test(post.avatar_url)) {
                post.avatar_url = `${req.protocol}://${req.get('host')}/uploads/${post.avatar_url.replace(/^\//, '')}`;
            }

            // Normalize post image_url similarly
            if (post.image_url && !/^https?:\/\//i.test(post.image_url)) {
                // if stored as '/post/filename' or 'post/filename', ensure correct absolute URL
                const filename = post.image_url.replace(/^(?:\/post\/|post\/|\/)*/i, '');
                post.image_url = `${req.protocol}://${req.get('host')}/post/${filename}`;
            }
        });

        Logger.apiEnd('POST', 'Get Posts');
        res.status(200).json(results);
    });
};


// ฟังก์ชันสำหรับการสร้างโพสต์
exports.createPost = (req, res) => {
    Logger.apiStart('POST', 'Create Post', { hasFile: !!req.file });
    
    upload.single('image')(req, res, (err) => {
        if (err) {
            Logger.error('POST', 'Error uploading file', err);
            return res.status(500).json({ message: 'Error uploading file', error: err });
        }

    const { group_id, user_id, content } = req.body;
    Logger.info('POST', 'Post data received', { group_id, user_id, hasContent: !!content });
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/post/${req.file.filename}` : null; // เก็บ path ของรูปภาพ

        if (!content && !image_url) {
            return res.status(400).json({ message: 'Content or image is required' });
        }

        // ตรวจสอบว่า user_id และ group_id มีอยู่ในฐานข้อมูล
        const checkUserQuery = 'SELECT user_id, name, avatar_url FROM users WHERE user_id = ?';
        connection.query(checkUserQuery, [user_id], (err, userResults) => {
            if (err) {
                return res.status(500).json({ message: 'Error checking user', error: err });
            }
            if (userResults.length === 0) {
                return res.status(400).json({ message: 'User does not exist' });
            }

            const user = userResults[0];  // Get the user data (name, avatar_url)
            const checkGroupQuery = 'SELECT group_id FROM `groups` WHERE group_id = ?';
            connection.query(checkGroupQuery, [group_id], (err, groupResults) => {
                if (err) {
                    return res.status(500).json({ message: 'Error checking group', error: err });
                }
                if (groupResults.length === 0) {
                    return res.status(400).json({ message: 'Group does not exist' });
                }

                // แทรกโพสต์ใหม่ในฐานข้อมูล
                const query = 'INSERT INTO posts (user_id, content, image_url, group_id) VALUES (?, ?, ?, ?)';
                connection.query(query, [user_id, content, image_url, group_id], (err, results) => {
                    if (err) {
                        Logger.error('POST', 'Error creating post', err);
                        return res.status(500).json({ message: 'Error creating post', error: err });
                    }

                    Logger.success('POST', 'Post created successfully', { post_id: results.insertId, user_id, group_id });
                    Logger.apiEnd('POST', 'Create Post');
                    
                    res.status(201).json({
                        id: results.insertId,
                        user_id,
                        content,
                        image_url,
                        group_id,
                        name: user.name,
                        avatar_url: user.avatar_url,
                        created_at: new Date().toISOString(),
                    });
                });
            });
        });
    });
};

// ฟังก์ชันสำหรับการลบโพสต์
exports.deletePost = (req, res) => {
    const { post_id } = req.body;
    Logger.apiStart('POST', 'Delete Post', { post_id });
  
    const getPostQuery = 'SELECT image_url FROM posts WHERE id = ?';
    connection.query(getPostQuery, [post_id], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching post details', error: err });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      const imageUrl = results[0].image_url;
  
            // ถ้ามี image_url ให้ลบไฟล์รูปภาพ
            if (imageUrl) {
                try {
                    // imageUrl in DB may be a full URL (http(s)://host/post/filename) or a relative path/filename
                    const filename = path.basename(String(imageUrl).split('?')[0]);
                    const imagePath = path.join(__dirname, '../..', 'post', filename);
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error('Error deleting image:', err);
                        }
                    });
                } catch (e) {
                    console.error('Error resolving image path for deletion:', e);
                }
            }
  
      const deleteQuery = 'DELETE FROM posts WHERE id = ?';
      connection.query(deleteQuery, [post_id], (err, results) => {
        if (err) {
          Logger.error('POST', 'Error deleting post', err);
          return res.status(500).json({ message: 'Error deleting post', error: err });
        }
        Logger.success('POST', 'Post deleted successfully', { post_id });
        Logger.apiEnd('POST', 'Delete Post');
        res.status(200).json({ message: 'Post deleted successfully' });
      });
    });
};

// ฟังก์ชันสำหรับการอัปเดตโพสต์
exports.updatePost = (req, res) => {
    Logger.apiStart('POST', 'Update Post');
    
    upload.single('image')(req, res, (err) => {
        if (err) {
            Logger.error('POST', 'Error uploading file', err);
            return res.status(500).json({ message: 'Error uploading file', error: err });
        }

    const { post_id, user_id, content } = req.body;
    Logger.info('POST', 'Update post data', { post_id, user_id });
    const image_url = req.file ? `${req.protocol}://${req.get('host')}/post/${req.file.filename}` : null;

        const getPostQuery = 'SELECT user_id, image_url FROM posts WHERE id = ?';
        connection.query(getPostQuery, [post_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Error fetching post details', error: err });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Post not found' });
            }

            if (results[0].user_id !== parseInt(user_id)) {
                return res.status(403).json({ message: 'You are not authorized to edit this post' });
            }

            // ลบรูปเดิมถ้ามี (ตรวจสอบและใช้เฉพาะชื่อไฟล์)
            if (image_url && results[0].image_url) {
                try {
                    const oldFilename = path.basename(String(results[0].image_url).split('?')[0]);
                    const oldImagePath = path.join(__dirname, '../..', 'post', oldFilename);
                    fs.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.error('Error deleting old image:', err);
                        }
                    });
                } catch (e) {
                    console.error('Error resolving old image path:', e);
                }
            }

            const updateQuery = 'UPDATE posts SET content = ?, image_url = ? WHERE id = ?';
            connection.query(updateQuery, [content, image_url || results[0].image_url, post_id], (err, updateResults) => {
                if (err) {
                    Logger.error('POST', 'Error updating post', err);
                    return res.status(500).json({ message: 'Error updating post', error: err });
                }

                Logger.success('POST', 'Post updated successfully', { post_id });
                Logger.apiEnd('POST', 'Update Post');
                
                res.status(200).json({
                    message: 'Post updated successfully',
                    post_id,
                    content,
                    image_url: image_url || results[0].image_url,
                });
            });
        });
    });
};

// ฟังก์ชันสำหรับการเพิ่มคอมเมนต์
exports.addComment = (req, res) => {
    const { post_id, user_id, content, avatar_url } = req.body; // เพิ่ม avatar_url
    Logger.apiStart('POST', 'Add Comment', { post_id, user_id });

    if (!content) {
        Logger.warn('POST', 'Comment content is required');
        return res.status(400).json({ message: 'Comment content is required' });
    }

    // ปรับคำสั่ง SQL ให้รองรับ avatar_url
    const query = 'INSERT INTO comments (post_id, user_id, content, avatar_url) VALUES (?, ?, ?, ?)';
    connection.query(query, [post_id, user_id, content, avatar_url], (err, results) => {
        if (err) {
            Logger.error('POST', 'Error adding comment', err);
            return res.status(500).json({ message: 'Error adding comment', error: err });
        }

        Logger.success('POST', 'Comment added successfully', { comment_id: results.insertId, post_id });
        Logger.apiEnd('POST', 'Add Comment');
        
        // ส่งข้อมูลกลับไปยัง Front-End รวมถึง avatar_url
        res.status(201).json({
            id: results.insertId,
            post_id,
            user_id,
            content,
            avatar_url, // ส่ง avatar_url กลับ
            created_at: new Date().toISOString(),
        });
    });
};


// ฟังก์ชันสำหรับการลบคอมเมนต์
exports.deleteComment = (req, res) => {
    const { comment_id, user_id } = req.body;
    Logger.apiStart('POST', 'Delete Comment', { comment_id, user_id });

    const getCommentQuery = 'SELECT user_id FROM comments WHERE id = ?';
    connection.query(getCommentQuery, [comment_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching comment details', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (results[0].user_id !== parseInt(user_id)) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        const deleteQuery = 'DELETE FROM comments WHERE id = ?';
        connection.query(deleteQuery, [comment_id], (err, results) => {
            if (err) {
                Logger.error('POST', 'Error deleting comment', err);
                return res.status(500).json({ message: 'Error deleting comment', error: err });
            }
            Logger.success('POST', 'Comment deleted successfully', { comment_id });
            Logger.apiEnd('POST', 'Delete Comment');
            res.status(200).json({ message: 'Comment deleted successfully' });
        });
    });
};

// ฟังก์ชันสำหรับการเพิ่มไลค์
exports.addLike = (req, res) => {
    const { post_id, user_id } = req.body;
    Logger.apiStart('POST', 'Add Like', { post_id, user_id });

    const checkLikeQuery = 'SELECT * FROM likes WHERE post_id = ? AND user_id = ?';
    connection.query(checkLikeQuery, [post_id, user_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking like status', error: err });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'You have already liked this post' });
        }

        const query = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
        connection.query(query, [post_id, user_id], (err, results) => {
            if (err) {
                Logger.error('POST', 'Error adding like', err);
                return res.status(500).json({ message: 'Error adding like', error: err });
            }

            Logger.success('POST', 'Like added successfully', { post_id, user_id });
            Logger.apiEnd('POST', 'Add Like');
            
            res.status(201).json({
                message: 'Like added successfully',
                post_id,
                user_id,
                created_at: new Date().toISOString(),
            });
        });
    });
};

// ฟังก์ชันสำหรับการลบไลค์
exports.removeLike = (req, res) => {
    const { post_id, user_id } = req.body;
    Logger.apiStart('POST', 'Remove Like', { post_id, user_id });

    const query = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
    connection.query(query, [post_id, user_id], (err, results) => {
        if (err) {
            Logger.error('POST', 'Error removing like', err);
            return res.status(500).json({ message: 'Error removing like', error: err });
        }

        if (results.affectedRows === 0) {
            Logger.warn('POST', 'Like not found', { post_id, user_id });
            return res.status(400).json({ message: 'Like not found' });
        }

        Logger.success('POST', 'Like removed successfully', { post_id, user_id });
        Logger.apiEnd('POST', 'Remove Like');
        res.status(200).json({ message: 'Like removed successfully' });
    });
};
