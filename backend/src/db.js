const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
  const dbName = process.env.MONGODB_DB || 'visitsdb';
  const fullUri = mongoUri.endsWith('/') ? `${mongoUri}${dbName}` : `${mongoUri}/${dbName}`;

  mongoose.set('strictQuery', true);

  await mongoose.connect(fullUri, {
    autoIndex: true,
  });
};

module.exports = { connectToDatabase };


