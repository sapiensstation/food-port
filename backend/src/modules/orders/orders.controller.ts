import { Controller, Post, Get, Patch, Body, Param, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const Public = () => SetMetadata('isPublic', true);

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Public()
  @Throttle({ order: { ttl: 60000, limit: 30 } })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  findOne(@Param('orderId') orderId: string) {
    return this.ordersService.findOne(orderId);
  }

  @Public()
  @Get(':orderId/status')
  getStatus(@Param('orderId') orderId: string) {
    return this.ordersService.getStatus(orderId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/cancel')
  cancel(@Param('orderId') orderId: string, @Body() body: { reason?: string }) {
    return this.ordersService.cancel(orderId, body.reason);
  }
}
