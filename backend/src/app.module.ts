import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Core modules
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FilesModule } from './modules/files/files.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ChatModule } from './modules/chat/chat.module';

// Guards, Interceptors, Filters
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';
import { ResponseTransformInterceptor } from './common/interceptors/response.transform.interceptors';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptors';
import { GlobalExceptionFilter } from './common/filters/global.exception.filters';

// Controllers
import { MetricsController } from './common/controllers/metrics.controller';

// Configuration
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { appConfig } from './config/app.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ['.env.development', '.env', '.env.production'],
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('jwt.expiresIn') || '24h';
        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn: expiresIn as any, // JWT library accepts string durations like '24h', '7d', etc.
          },
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting with @nestjs/throttler
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: configService.get<number>('app.rateLimit.ttl') || 60000, // 60 seconds
            limit: configService.get<number>('app.rateLimit.limit') || 100, // 100 requests
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Cache Manager - Native in-memory cache. Make cache settings configurable
    CacheModule.register({
      isGlobal: true,
      ttl: parseInt(process.env.CACHE_TTL, 10),
      max: parseInt(process.env.CACHE_MAX_ITEMS, 10),
    }),

    // Application modules. Enable guards in CommonModule (single registration point)
    CommonModule.forRoot({
      enableGlobalGuards: true,
      enableGlobalFilters: false, // Filters registered in AppModule
      enableGlobalInterceptors: false, // Interceptors registered in AppModule
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    MessagesModule,
    NotificationsModule,
    FilesModule,
    AnalyticsModule,
    ChatModule,
  ],
  controllers: [MetricsController],
  providers: [
    // Global Guards
    // ThrottlerGuard for rate limiting (from @nestjs/throttler)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JwtAuthGuard configured in CommonModule.forRoot()

    // Global interceptors (specific to AppModule)
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },

    // Global filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
