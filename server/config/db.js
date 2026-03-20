const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MongoDB Connection Error: MONGODB_URI is not set in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (mongoUri.startsWith('mongodb+srv://') && /querySrv|ENOTFOUND|ECONNREFUSED/i.test(error.message)) {
      console.error(
        'Atlas SRV lookup failed. This usually means your current DNS server or network cannot resolve MongoDB SRV records.'
      );
      console.error(
        'Try switching your DNS to 8.8.8.8 or 1.1.1.1, or use the non-SRV Atlas connection string from MongoDB Atlas.'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
