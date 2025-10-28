export const appConfig = () => ({
  app: {
    port: parseInt(process.env.PORT, 10),
    environment: process.env.NODE_ENV,
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL, 10), // 60 seconds
      limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10), // 100 requests per minute
    },
    file: {
      maxSize: parseInt(process.env.FILE_MAX_SIZE, 10), // 10MB
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
      uploadPath: process.env.UPLOAD_PATH,
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    },
  },
});
