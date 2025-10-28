import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { APP_CONSTANTS } from './common/constants/app.constants';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);

    // Security middleware
    app.use(helmet());
    app.use(compression());

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
      .addServer('https://api.yourdomain.com', 'Production server')
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
