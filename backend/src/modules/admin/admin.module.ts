import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController, HealthController, PromotionsPublicController } from './admin.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AdminController, HealthController, PromotionsPublicController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
