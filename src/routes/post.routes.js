const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');

// เส้นทางสำหรับการดึงโพสต์
router.get('/:communityId', postController.getPosts);

// เส้นทางสำหรับการสร้างโพสต์
router.post('/createPost', postController.createPost);

// เส้นทางสำหรับการลบโพสต์
router.post('/deletePost', postController.deletePost);

// เส้นทางสำหรับการแก้ไขโพสต์
router.post('/updatePost', postController.updatePost);

// เส้นทางสำหรับการเพิ่มคอมเมนต์
router.post('/addComment', postController.addComment);

// เส้นทางสำหรับการลบคอมเมนต์
/*router.post('/deleteComment', postController.deleteComment);*/

// เส้นทางสำหรับการเพิ่มไลค์
router.post('/addLike', postController.addLike);

// เส้นทางสำหรับการลบไลค์
router.post('/removeLike', postController.removeLike);

module.exports = router;
