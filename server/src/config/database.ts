import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-platform';

    // Connection options optimized for MongoDB Atlas
    const options: mongoose.ConnectOptions = {
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timeout

      // Retry settings
      retryWrites: true, // Retry write operations
      retryReads: true, // Retry read operations

      // Heartbeat settings
      heartbeatFrequencyMS: 10000 // Frequency of server monitoring
    };

    await mongoose.connect(mongoUri, options);

    // Log connection details (without sensitive info)
    const isAtlas = mongoUri.includes('mongodb.net') || mongoUri.includes('mongodb+srv');
    console.log(`✅ MongoDB connected successfully (${isAtlas ? 'Atlas' : 'Local'})`);
    console.log(`   Database: ${mongoose.connection.db?.databaseName || 'N/A'}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('   Please check your MONGODB_URI in .env file');
    process.exit(1);
  }
};
