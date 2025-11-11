import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => {
    //     const secret = configService.get<string>('jwt.secret');
    //     const expiresIn = configService.get<string>('jwt.expiresIn');

    //     return {
    //       secret: secret,
    //       signOptions: {
    //         expiresIn,
    //       },
    //     } as never;
    //   },
    //   inject: [ConfigService],
    // }),
    // JwtModule is already registered globally in app.module.ts
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
