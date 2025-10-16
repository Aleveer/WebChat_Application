import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
}
bootstrap();
