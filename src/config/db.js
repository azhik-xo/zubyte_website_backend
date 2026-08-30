import mongoose from 'mongoose';

// Disable query buffering so operations fail immediately or use memory fallback instead of hanging for 10,000ms
mongoose.set('bufferCommands', false);

/**
 * Connect to MongoDB with auto-reconnect and lifecycle event logging
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zubyte_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      autoIndex: true,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Database connection events
    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection disconnected');
    });

    return conn;
  } catch (error) {
    console.warn(`\n⚠️  [Database Notice] Could not connect to MongoDB at: ${mongoUri}`);
    console.warn(`   → Running in seamless local memory mode.`);
    console.warn(`   → To connect MongoDB Atlas: add your MONGODB_URI in backend/.env:`);
    console.warn(`     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/zubyte_db?retryWrites=true&w=majority\n`);
  }
};
