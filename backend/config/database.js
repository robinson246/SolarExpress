const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    try {
      await conn.connection.db.collection('users').dropIndex('walletAddress_1');
      console.log('Dropped legacy unique index on walletAddress');
    } catch {
      // index doesn't exist or already dropped — safe to ignore
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
