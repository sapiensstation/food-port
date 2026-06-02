import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierDto,
  UpdateVendorSettingsDto, UpdateVendorStatusDto,
} from './dto/create-menu-item.dto';

@ApiTags('Vendor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'admin')
@Controller('vendor')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtUser) {
    return this.vendorService.getDashboard(user);
  }

  @Get('orders')
  getOrders(
    @CurrentUser() user: JwtUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendorService.getOrders(user, from, to, status, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('orders/:orderId')
  getOrder(@Param('orderId') orderId: string) {
    return { orderId }; // Delegates to orders service; minimal stub
  }

  // ── Full structured menu ───────────────────────────────────────────────────
  @Get('menu')
  getMenu(@CurrentUser() user: JwtUser) {
    return this.vendorService.getMenu(user);
  }

  // ── Menu Items ─────────────────────────────────────────────────────────────
  @Get('menu-items')
  getMenuItems(
    @CurrentUser() user: JwtUser,
    @Query('category') categoryId?: string,
    @Query('available') available?: string,
  ) {
    const avail = available === undefined ? undefined : available !== 'false';
    return this.vendorService.getMenuItems(user, categoryId, avail);
  }

  @Post('menu-items')
  @Roles('vendor_owner', 'admin')
  createMenuItem(@CurrentUser() user: JwtUser, @Body() dto: CreateMenuItemDto) {
    return this.vendorService.createMenuItem(user, dto);
  }

  @Put('menu-items/:id')
  @Roles('vendor_owner', 'admin')
  updateMenuItem(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.vendorService.updateMenuItem(user, id, dto);
  }

  @Delete('menu-items/:id')
  @Roles('vendor_owner', 'admin')
  deleteMenuItem(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteMenuItem(user, id);
  }

  @Patch('menu-items/:id/availability')
  updateAvailability(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.vendorService.updateAvailability(user, id, dto);
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  @Get('categories')
  getCategories(@CurrentUser() user: JwtUser) {
    return this.vendorService.getCategories(user);
  }

  @Post('categories')
  @Roles('vendor_owner', 'admin')
  createCategory(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDto) {
    return this.vendorService.createCategory(user, dto);
  }

  @Put('categories/:id')
  @Roles('vendor_owner', 'admin')
  updateCategory(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.vendorService.updateCategory(user, id, dto);
  }

  // ── Modifier Groups ────────────────────────────────────────────────────────
  @Post('modifier-groups')
  @Roles('vendor_owner', 'admin')
  createModifierGroup(@CurrentUser() user: JwtUser, @Body() dto: CreateModifierGroupDto) {
    return this.vendorService.createModifierGroup(user, dto);
  }

  @Put('modifier-groups/:id')
  @Roles('vendor_owner', 'admin')
  updateModifierGroup(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.vendorService.updateModifierGroup(user, id, dto);
  }

  @Post('modifier-groups/:id/modifiers')
  @Roles('vendor_owner', 'admin')
  addModifier(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CreateModifierDto) {
    return this.vendorService.addModifier(user, id, dto);
  }

  @Delete('modifier-groups/:groupId/modifiers/:modId')
  @Roles('vendor_owner', 'admin')
  removeModifier(@CurrentUser() user: JwtUser, @Param('groupId') groupId: string, @Param('modId') modId: string) {
    return this.vendorService.removeModifier(user, groupId, modId);
  }

  @Delete('modifier-groups/:id')
  @Roles('vendor_owner', 'admin')
  deleteModifierGroup(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteModifierGroup(user, id);
  }

  @Post('menu-items/:itemId/modifier-groups/:groupId')
  @Roles('vendor_owner', 'admin')
  linkModifierGroup(@CurrentUser() user: JwtUser, @Param('itemId') itemId: string, @Param('groupId') groupId: string) {
    return this.vendorService.linkModifierGroupToItem(user, itemId, groupId);
  }

  @Delete('menu-items/:itemId/modifier-groups/:groupId')
  @Roles('vendor_owner', 'admin')
  unlinkModifierGroup(@CurrentUser() user: JwtUser, @Param('itemId') itemId: string, @Param('groupId') groupId: string) {
    return this.vendorService.unlinkModifierGroupFromItem(user, itemId, groupId);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  @Get('settings')
  getSettings(@CurrentUser() user: JwtUser) {
    return this.vendorService.getSettings(user);
  }

  @Put('settings')
  @Roles('vendor_owner', 'admin')
  updateSettings(@CurrentUser() user: JwtUser, @Body() dto: UpdateVendorSettingsDto) {
    return this.vendorService.updateSettings(user, dto);
  }

  @Patch('status')
  updateStatus(@CurrentUser() user: JwtUser, @Body() dto: UpdateVendorStatusDto) {
    return this.vendorService.updateStatus(user, dto);
  }
}
