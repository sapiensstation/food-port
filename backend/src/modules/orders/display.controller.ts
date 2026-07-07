import { Controller, Get, Query, SetMetadata } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';

const Public = () => SetMetadata('isPublic', true);

@SkipThrottle({ auth: true, order: true })
@ApiTags('Display Board')
@Controller('display')
export class DisplayController {
  constructor(private ordersService: OrdersService) {}

  @Public()
  @Get('board')
  getBoard(@Query('vendor_id') vendorId?: string) {
    return this.ordersService.getDisplayBoard(vendorId);
  }
}
