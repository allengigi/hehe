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

/* // Add a like to a post
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Add the user ID to the post's likes array
    await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a like from a post
router.delete('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Remove the user ID from the post's likes array
    await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });

    res.status(200).json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}); */
router.post('/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;

    // Check if the post already contains the user's like
    const post = await Post.findById(postId);
    const likedByUser = post.likes.includes(userId);

    if (likedByUser) {
      // If the user already liked the post, remove their like
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      res.status(200).json({ liked: false });
    } else {
      // If the user has not liked the post, add their like
      await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
      res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
