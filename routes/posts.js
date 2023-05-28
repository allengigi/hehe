const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const Post = require('../models/post');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'pictures/groups/post/images');
  },
  filename: function (req, file, cb) {
    const postId = uuidv4(); 
    const filename = `group_${req.body.groupId}_post_${postId}.png`;
    req.postId = postId;
    cb(null, filename);
  }
});

const upload = multer({ storage });

router.post('/create', upload.single('image'), async (req, res) => {
  try {
    const { groupId } = req.body;
    const imagePath = req.file.path; 
    const postId = req.postId;


    const post = new Post({
      groupId,
      image: path.basename(imagePath),
      postId
    });
    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create image post' });
  }
});


router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const posts = await Post.find({ groupId });

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

module.exports = router;
