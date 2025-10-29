import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { validateEnvironment } from './common/utils/env-validation.utils';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    // Validate environment variables before starting
    validateEnvironment();

    const app = await NestFactory.create(AppModule);

    // Security middleware - Helmet with comprehensive security headers
    app.use(
      helmet({
        // Content Security Policy
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        // Cross-Origin policies
        crossOriginEmbedderPolicy: false, // Disable if using external resources
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
        // HTTP Strict Transport Security
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        },
        // X-Frame-Options
        frameguard: {
          action: 'deny',
        },
        // X-Content-Type-Options
        noSniff: true,
        // Referrer-Policy
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin',
        },
        // X-XSS-Protection (legacy, but still useful)
        xssFilter: true,
        // Hide X-Powered-By header
        hidePoweredBy: true,
      }),
    );

    // Compression middleware
    app.use(
      compression({
        // Only compress responses larger than 1KB
        threshold: 1024,
        // Compression level (0-9, 6 is default balance)
        level: 6,
        // Filter function to determine what to compress
        filter: (req, res) => {
          // Don't compress if client doesn't support it
          if (req.headers['x-no-compression']) {
            return false;
          }
          // Use compression filter for everything else
          return compression.filter(req, res);
        },
        // Memory level (1-9, 8 is default)
        memLevel: 8,
      }),
    );

    // Body size limit
    app.use('/files/upload', (req, res, next) => {
      // 5 minutes timeout for file uploads
      req.setTimeout(300000);
      next();
    });

    // Setup Swagger Documentation
    const config = new DocumentBuilder()
      .setTitle('WebChat API')
      .setDescription('WebChat Application API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer('http://localhost:3000', 'Development server')
      //.addServer('https://api.yourdomain.com', 'Production server')
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Groups', 'Group management endpoints')
      .addTag('Messages', 'Message endpoints')
      .addTag('Notifications', 'Notification endpoints')
      .addTag('Files', 'File management endpoints')
      .addTag('Analytics', 'Analytics endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    // Set global prefix for API versioning
    app.setGlobalPrefix('api/v1', {
      exclude: ['/', '/ping', '/api/docs'],
    });

    // Security headers
    app.enableShutdownHooks();

    // Enable validation pipes globally
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    const frontendUrl = process.env.FRONTEND_URL;
    const frontendDomain = process.env.FRONTEND_DOMAIN || 'localhost';
    const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
    const inferredUrl = `http://${frontendDomain}:${frontendPort}`;
    const inferredLocalhost = `http://localhost:${frontendPort}`;
    const inferredLoopback = `http://127.0.0.1:${frontendPort}`;
    const origins = Array.from(
      new Set(
        [
          frontendUrl?.trim(),
          inferredUrl,
          inferredLocalhost,
          inferredLoopback,
        ].filter(Boolean),
      ),
    );

    app.enableCors({
      origin: origins,
      credentials: true,
    });

    const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000);
    await app.listen(port);
    logger.log(`🚀 WebChat Backend is running on port ${port}`);
  } catch (error) {
    logger.error('❌ Failed to start WebChat Backend:', error);
    process.exit(1);
  }
}
bootstrap();
