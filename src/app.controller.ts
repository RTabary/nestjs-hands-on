import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('vroom')
  getVroom() {
    return this.appService.getVroom();
  }
}
