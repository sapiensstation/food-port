import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { KdsService } from './kds.service';
import { RejectItemDto } from './dto/reject-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('KDS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor_kitchen', 'vendor_cashier', 'vendor_owner', 'admin')
@Controller('kds')
export class KdsController {
  constructor(private kdsService: KdsService) {}

  @Get('orders')
  getOrders(@CurrentUser() user: JwtUser) {
    return this.kdsService.getOrders(user);
  }

  @Patch('items/:itemId/accept')
  accept(@Param('itemId') itemId: string, @CurrentUser() user: JwtUser) {
    return this.kdsService.updateItemStatus(itemId, 'accepted', user);
  }

  @Patch('items/:itemId/preparing')
  preparing(@Param('itemId') itemId: string, @CurrentUser() user: JwtUser) {
    return this.kdsService.updateItemStatus(itemId, 'preparing', user);
  }

  @Patch('items/:itemId/ready')
  ready(@Param('itemId') itemId: string, @CurrentUser() user: JwtUser) {
    return this.kdsService.updateItemStatus(itemId, 'ready', user);
  }

  @Patch('items/:itemId/complete')
  complete(@Param('itemId') itemId: string, @CurrentUser() user: JwtUser) {
    return this.kdsService.updateItemStatus(itemId, 'completed', user);
  }

  @Patch('items/:itemId/reject')
  reject(
    @Param('itemId') itemId: string,
    @Body() dto: RejectItemDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.kdsService.updateItemStatus(itemId, 'rejected', user, dto);
  }

  @Get('queue-stats')
  queueStats(@CurrentUser() user: JwtUser) {
    return this.kdsService.getQueueStats(user);
  }
}
