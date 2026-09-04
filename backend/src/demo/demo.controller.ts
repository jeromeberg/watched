import { Controller, Post } from '@nestjs/common';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  /** Create a temporary demo account and return a session token for it. */
  @Post()
  create() {
    return this.demoService.createDemoAccount();
  }
}
