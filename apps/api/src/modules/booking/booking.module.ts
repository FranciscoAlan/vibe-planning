import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IdentityModule } from '../identity/identity.module.js';

@Module({
  imports: [PassportModule, IdentityModule],
  controllers: [BookingController],
  providers: [BookingService, JwtAuthGuard, PrismaService],
  exports: [BookingService],
})
export class BookingModule {}
