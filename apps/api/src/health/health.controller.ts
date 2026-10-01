import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async check() {
    const result = await this.health.check();
    if (result.status === 'error') {
      throw new ServiceUnavailableException(result);
    }
    return result;
  }
}
