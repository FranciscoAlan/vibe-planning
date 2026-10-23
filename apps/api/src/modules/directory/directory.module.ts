import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller.js';
import { DirectoryService } from './directory.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { IdentityModule } from '../identity/identity.module.js';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard.js';

@Module({
  imports: [IdentityModule],
  controllers: [DirectoryController],
  providers: [DirectoryService, PrismaService, JwtAuthGuard],
  exports: [DirectoryService],
})
export class DirectoryModule {}
