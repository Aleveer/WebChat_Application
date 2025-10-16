import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getPing(): string {
    return 'pong';
  }

  getB(): { message: string } {
    return { message: 'This is B' };
  }

  getA(): { from: string; b: { message: string } } {
    const b = this.getB();
    return { from: 'A', b };
  }
}
