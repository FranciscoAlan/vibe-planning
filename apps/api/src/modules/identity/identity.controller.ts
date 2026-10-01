import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('identity')
export class IdentityController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'identity module not implemented yet' };
  }
}
