import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller.js';
import { DirectoryService } from './directory.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Module({
  controllers: [DirectoryController],
  providers: [DirectoryService, PrismaService],
  exports: [DirectoryService],
})
export class DirectoryModule {}
