import {
  getEnv,
  getEnvNumber,
  getEnvBoolean,
} from '../common/utils/env-validation.utils';

export const appConfig = () => ({
  app: {
    port: getEnvNumber('PORT', 3000),
    environment: getEnv('NODE_ENV', 'development'),
    cors: {
      origin: getEnv('FRONTEND_URL', 'http://localhost:5173'),
      credentials: true,
    },
    rateLimit: {
      ttl: getEnvNumber('RATE_LIMIT_TTL', 60000), // 60 seconds
      limit: getEnvNumber('RATE_LIMIT_LIMIT', 100), // 100 requests per minute
    },
    file: {
      maxSize: getEnvNumber('FILE_MAX_SIZE', 10485760), // 10MB in bytes
      allowedMimes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      uploadPath: getEnv('UPLOAD_PATH', './uploads'),
    },
    email: {
      host: getEnv('EMAIL_HOST', 'smtp.gmail.com'),
      port: getEnvNumber('EMAIL_PORT', 587),
      secure: getEnvBoolean('EMAIL_SECURE', false),
      auth: {
        user: getEnv('EMAIL_USER', ''),
        pass: getEnv('EMAIL_PASS', ''),
      },
    },
  },
});
