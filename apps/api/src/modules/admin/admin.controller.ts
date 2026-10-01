import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'admin module not implemented yet' };
  }
}
