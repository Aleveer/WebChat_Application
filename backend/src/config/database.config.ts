import { getEnv, getEnvNumber } from '../common/utils/env-validation.utils';

export const databaseConfig = () => ({
  database: {
    uri: getEnv('MONGODB_URI'),
    options: {
      maxPoolSize: getEnvNumber('DB_MAX_POOL_SIZE', 10),
      serverSelectionTimeoutMS: getEnvNumber(
        'DB_SERVER_SELECTION_TIMEOUT_MS',
        5000,
      ),
      socketTimeoutMS: getEnvNumber('DB_SOCKET_TIMEOUT_MS', 45000),
      bufferMaxEntries: 0,
      bufferCommands: false,
    },
  },
});
