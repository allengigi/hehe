//const { createServer } = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group')
const profileRoutes = require('./routes/profile')
const postRoutes = require('./routes/posts')
require('dotenv').config();


const app = express();
const port = 3000;


app.use(bodyParser.json({ limit: '50mb' }));


app.use('/auth', authRoutes);
app.use('/group', groupRoutes);
app.use('/profile',profileRoutes);
app.use('/posts',postRoutes);
app.use('/pictures', express.static(__dirname + "/pictures"));


mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    console.log(process.env.JWT_SECRET)
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  
//const server = createServer(app);


//module.exports = server;
