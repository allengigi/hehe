const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  profilePicture: {
    type: String,
    //default: '/pictures/default.png'
  },
  groupsFollowing: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
});


module.exports = mongoose.model('User', userSchema);
