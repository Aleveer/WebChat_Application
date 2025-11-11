import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { Public } from '../../common/decorators/custom.decorators';
import { ThrottleGuard } from '../../common/guards/throttle.guards';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottleGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signUp(
    @Body()
    body: {
      username: string;
      password: string;
      phone?: string;
      photo?: string;
      email?: string;
      full_name?: string;
    },
  ) {
    const user = await this.authService.signUp(body);
    return {
      message: 'Signup successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email ?? null,
        phone: user.phone ?? null,
        photo: user.photo ?? null,
        full_name: user.full_name ?? null,
      },
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: any) {
    // Handle both Mongoose document and plain object
    const userData = req.user._doc || req.user;
    return this.authService.login(userData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: any) {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    return this.authService.logout(token);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ status: 200, description: 'Forgot password successful' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  //Applies this when reset password button is clicked
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 200, description: 'Reset password successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 400, description: 'Invalid password' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
