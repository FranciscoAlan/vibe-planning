import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('directory')
export class DirectoryController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'directory module not implemented yet' };
  }
}
