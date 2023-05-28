const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

   
    const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

   
    const hashedPassword = await bcrypt.hash(password, 10);

    

    const newUser = new User({
      username: username,
      password: hashedPassword,
      email: email,
    });

  
    const savedUser = await newUser.save();
    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '2h' });

  
    const savedUserData = {
      userId: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
    };

    res.status(200).json(savedUserData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

   
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

  
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    res.json({ 
      token, 
      userId: user._id,
      username: user.username,});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;
