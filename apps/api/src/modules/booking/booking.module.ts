import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller.js';

@Module({
  controllers: [BookingController],
})
export class BookingModule {}
