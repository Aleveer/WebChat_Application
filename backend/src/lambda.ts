import { Handler } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import { join } from 'path';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { validateEnvironment } from './common/utils/env-validation.utils';

let cachedServer: ReturnType<typeof serverlessExpress> | null = null;

async function bootstrapServer() {
  const logger = new Logger('LambdaBootstrap');

  validateEnvironment();

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
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
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      noSniff: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      xssFilter: true,
      hidePoweredBy: true,
    }),
  );

  app.use(
    compression({
      threshold: 1024,
      level: 6,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      memLevel: 8,
    }),
  );

  app.use('/files/upload', (req, res, next) => {
    req.setTimeout(300000);
    next();
  });

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

  app.use(
    '/files',
    express.static(join(process.cwd(), 'uploads'), {
      maxAge: '1d',
      setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['/', '/ping', '/api/docs'],
  });

  app.enableShutdownHooks();

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

  await app.init();
  logger.log('NestJS application initialised for Lambda');

  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }

  return cachedServer(event, context);
};
