const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dspcoder123:Dinesh%40123@cluster524.xavl3.mongodb.net/MyDatabase?retryWrites=true&w=majority&appName=Cluster524", { useNewUrlParser: true, useUnifiedTopology: true }';
  const dbName = process.env.MONGODB_DB || 'visitsdb';
  const fullUri = mongoUri.endsWith('/') ? `${mongoUri}${dbName}` : `${mongoUri}/${dbName}`;

  mongoose.set('strictQuery', true);

  await mongoose.connect(fullUri, {
    autoIndex: true,
  });
};

module.exports = { connectToDatabase };


