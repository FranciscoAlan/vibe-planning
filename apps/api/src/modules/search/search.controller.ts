import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('search')
export class SearchController {
  @Get()
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  placeholder() {
    return { message: 'search module not implemented yet' };
  }
}
