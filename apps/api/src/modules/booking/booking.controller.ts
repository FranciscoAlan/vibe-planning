import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('booking')
export class BookingController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'booking module not implemented yet' };
  }
}
