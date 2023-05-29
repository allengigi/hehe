const express = require('express');
const router = express.Router();
const fs = require('fs');
const sharp = require('sharp');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const Group = require('../models/group');
const Post = require('../models/post')
const User = require('../models/user');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../pictures/groupimages'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/creategroup', upload.single('image'), async (req, res) => {
  try {
    const { userId, groupName, bio, purpose } = req.body;
    const imageFile = req.file;

    // Generate a unique filename for the compressed image
    const fileName = `${uuidv4()}.jpeg`;

    const destinationPath = path.join(__dirname, '../pictures/groupimages', fileName);

    // Compress the image using sharp
    await sharp(imageFile.path)
      .resize(720, 720) 
      .jpeg({ quality: 80 }) // Set desired width, height, and compression quality for the compressed image
      .toFile(destinationPath);

    // Remove the original file
    fs.unlinkSync(imageFile.path);

    const group = new Group({
      userId,
      groupName,
      bio,
      image: fileName, // Store only the basename of the image file
      purpose
    });

    await group.save();

    res.status(201).json({ group, groupId: group._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get('/search/groups', async (req, res) => {
  try {
    const { query } = req.query;
    const regex = new RegExp(query, 'i'); 

    
    const groups = await Group.find({ groupName: regex });

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search/groups/mygroup', async (req, res) => {
  try {
    const { userId } = req.query;

    
    const groups = await Group.find({ userId });

    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/othergroups', async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Find all groups except the ones created by the user and the ones the user is already following
    const groups = await Group.find({ 
      userId: { $ne: userId },
      _id: { $nin: await getFollowedGroupIds(userId) }
    });
    
    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

/* router.get('/posts/followed', async (req, res) => {
  try {
    const { userId } = req.query;

    const posts = await fetchFollowedGroupsPosts(userId);
    const groupIds = posts.map(post => post.groupId);

    const groups = await fetchGroupDetails(groupIds);

    const groupsWithPosts = groups.map(group => {
      const groupPosts = posts.filter(post => post.groupId.toString() === group._id.toString());
      
   
     return {
        groupId: group._id,
        groupName: group.groupName,
        image: group.image,
        purpose: group.purpose,
        bio: group.bio,
        followerCount: group.followers.length,
        posts: groupPosts.map(post => ({
          image: post.image,
          createdAt: post.createdAt,
          postId: post._id,
          likes: post.likes
        }))
      };
    });
    console.log(groupsWithPosts);

    res.status(200).json(groupsWithPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});  */

router.get('/posts/followed', async (req, res) => {
  try {
    const { userId } = req.query;

    const followedGroupPosts = await fetchFollowedGroupsPosts(userId);
    const userPosts = await fetchUserPosts(userId);
    const userGroupsWithPosts = await fetchUserGroupsWithPosts(userId);

    const groupIds = [...followedGroupPosts, ...userPosts, ...userGroupsWithPosts]
      .map(post => post.groupId.toString());

    const groups = await fetchGroupDetails(groupIds);

    const groupsWithPosts = groups.map(group => {
      const groupPosts = followedGroupPosts
        .filter(post => post.groupId.toString() === group._id.toString());
      const userGroupPosts = userPosts
        .filter(post => post.groupId.toString() === group._id.toString());

      const combinedPosts = [...groupPosts, ...userGroupPosts];

      return {
        groupId: group._id,
        groupName: group.groupName,
        image: group.image,
        purpose: group.purpose,
        bio: group.bio,
        followerCount: group.followers.length,
        posts: combinedPosts.map(post => ({
          image: post.image,
          createdAt: post.createdAt,
          postId: post._id,
          likes: post.likes
        }))
      };
    });

    groupsWithPosts.push(...userGroupsWithPosts);

    res.status(200).json(groupsWithPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to follow a group
router.post('/follow/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.query;

    // Update the user's groupsFollowing array
    await User.findByIdAndUpdate(userId, { $addToSet: { groupsFollowing: groupId } });

    // Update the group's followers count
    const updatedGroup = await Group.findByIdAndUpdate(groupId, { $addToSet: { followers: userId } });

    // Find the posts belonging to the group
    const posts = await Post.find({ groupId });
    const postImages = posts.map(post => post.image)
    const group = {
      groupId: updatedGroup._id,
      groupName: updatedGroup.groupName,
      followerCount: updatedGroup.followers.length,
      image: updatedGroup.image,
      posts: postImages,
      bio: updatedGroup.bio,
      purpose: updatedGroup.purpose
    }
   console.log(group)

    res.status(200).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
})

async function getFollowedGroupIds(userId) {
  try {
    const user = await User.findById(userId).populate('groupsFollowing');
    return user.groupsFollowing.map(group => group._id);
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Function to fetch posts of the groups the user is following
async function fetchFollowedGroupsPosts(userId) {
  try {
    // Get the user's groupsFollowing array
    const user = await User.findById(userId).populate('groupsFollowing');
    const followedGroupIds = user.groupsFollowing.map(group => group._id);

    // Fetch the posts of the followed groups
    const posts = await Post.find({ groupId: { $in: followedGroupIds } });

    return posts;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchGroupDetails(groupIds) {
  try {
    const groups = await Group.find({ _id: { $in: groupIds } });
    return groups;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchUserPosts(userId) {
  try {
    // Fetch the groups created by the user
    const userGroups = await Group.find({ userId });
    const groupIds = userGroups.map(group => group._id);

    // Fetch the posts of the user's groups
    const posts = await Post.find({ groupId: { $in: groupIds } });
    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
}

async function fetchUserGroupsWithPosts(userId) {
  try {
    const groups = await Group.find({ userId });
    const groupIds = groups.map(group => group._id);
    const posts = await Post.find({ groupId: { $in: groupIds } });

    return groups.map(group => ({
      groupId: group._id,
      groupName: group.groupName,
      image: group.image,
      purpose: group.purpose,
      bio: group.bio,
      followerCount: group.followers.length,
      posts: posts
        .filter(post => post.groupId.toString() === group._id.toString())
        .map(post => ({
          image: post.image,
          createdAt: post.createdAt,
          postId: post._id,
          likes: post.likes
        }))
    }));
  } catch (error) {
    console.error('Error fetching user groups with posts:', error);
    return [];
  }
}

module.exports = router;
