export const databaseConfig = () => ({
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10),
      serverSelectionTimeoutMS:
        parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS, 10),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS, 10),
      bufferMaxEntries: 0,
      bufferCommands: false,
    },
  },
});
