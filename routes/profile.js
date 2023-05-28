const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const sharp = require('sharp');
const multer = require('multer');
const User = require('../models/user');



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname,'../pictures/profileimages')); 
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); 
  }
});
const upload = multer({ storage: storage });


router.post('/updatePicture/:userId', upload.single('image'), async (req, res) => {
  const userId = req.params.userId;

  const imageFile = req.file;

  // Generate a unique filename for the compressed image
  const fileName = `${userId}.jpeg`;

  const destinationPath = path.join(__dirname, '../pictures/profileimages', fileName);

  // Compress the image using sharp
  await sharp(imageFile.path)
  .resize(720, 720) 
  .jpeg({ quality: 40 }) // Set desired width, height, and compression quality for the compressed image
  .toFile(destinationPath);

  // Remove the original file
  fs.unlinkSync(imageFile.path);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: `/pictures/profileimages/${userId}.jpeg` } },
      { new: true }
    );
  
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

/* router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json({ group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}); */

module.exports = router;
