import { Module } from '@nestjs/common';
import { KdsController } from './kds.controller';
import { KdsService } from './kds.service';
import { PrismaService } from '../../database/prisma.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [KdsController],
  providers: [KdsService, PrismaService],
})
export class KdsModule {}
