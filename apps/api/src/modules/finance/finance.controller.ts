import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('finance')
export class FinanceController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'finance module not implemented yet' };
  }
}
