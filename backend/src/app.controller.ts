import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/hello')
  getApiHello() {
    return { message: this.appService.getHello() };
  }

  @Get('ping')
  ping(): string {
    return this.appService.getPing();
  }

  @Get('api/b')
  getB() {
    return this.appService.getB();
  }

  @Get('api/a')
  getA() {
    return this.appService.getA();
  }
}
