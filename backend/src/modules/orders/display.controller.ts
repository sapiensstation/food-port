import { Controller, Get, SetMetadata } from '@nestjs/common';
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
  getBoard() {
    return this.ordersService.getDisplayBoard();
  }
}
