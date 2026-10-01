import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('chat')
export class ChatController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'chat module not implemented yet' };
  }
}
