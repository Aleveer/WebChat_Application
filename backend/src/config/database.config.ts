export const databaseConfig = () => ({
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/webchat',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    },
  },
});
