import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierDto,
  UpdateVendorSettingsDto, UpdateVendorStatusDto,
} from './dto/create-menu-item.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, activeItems, completedItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { items: { some: { vendor_id: vendorId } }, created_at: { gte: today } },
        include: { items: { where: { vendor_id: vendorId }, select: { total_price: true, status: true, item_name: true } } },
      }),
      this.prisma.orderItem.count({
        where: { vendor_id: vendorId, status: { in: ['pending', 'accepted', 'preparing', 'ready'] } },
      }),
      this.prisma.orderItem.findMany({
        where: { vendor_id: vendorId, status: 'completed', completed_at: { gte: today } },
        select: { estimated_prep_time: true, accepted_at: true, completed_at: true },
      }),
    ]);

    const revenue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.total_price, 0), 0);

    // Top items by count
    const itemCounts: Record<string, number> = {};
    orders.forEach((o) => o.items.forEach((i) => { itemCounts[i.item_name] = (itemCounts[i.item_name] ?? 0) + 1; }));
    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const avgPrepTime = completedItems.length > 0
      ? Math.round(completedItems.reduce((sum, i) => sum + i.estimated_prep_time, 0) / completedItems.length)
      : 10;

    return {
      vendor_id: vendorId,
      today: {
        order_count: orders.length,
        revenue: Math.round(revenue * 100) / 100,
        avg_prep_time_minutes: avgPrepTime,
        active_orders_count: activeItems,
        top_items: topItems,
      },
      date: today.toISOString().slice(0, 10),
    };
  }

  async getOrders(user: JwtUser, from?: string, to?: string, status?: string, page = 1, limit = 20) {
    const vendorId = this.requireVendor(user);
    const skip = (page - 1) * limit;

    const where = {
      vendor_id: vendorId,
      ...(status ? { status: status as 'pending' } : {}),
      ...(from || to ? { created_at: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where,
        include: { order: { select: { token_number: true, table_id: true, status: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.orderItem.count({ where }),
    ]);

    const tableIds = [...new Set(items.map((i) => i.order.table_id))];
    const tables = await this.prisma.table.findMany({ where: { id: { in: tableIds } }, select: { id: true, table_number: true } });
    const tableMap = Object.fromEntries(tables.map((t) => [t.id, t.table_number]));

    return {
      data: items.map((item) => ({
        id: item.id,
        order_id: item.order_id,
        token_number: item.order.token_number,
        table_number: tableMap[item.order.table_id] ?? 0,
        status: item.status,
        item_name: item.item_name,
        quantity: item.quantity,
        total_vendor_amount: item.total_price,
        created_at: item.created_at.toISOString(),
      })),
      meta: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: skip + limit < total, has_prev: page > 1 },
    };
  }

  // ─── Menu Items ─────────────────────────────────────────────────────────────

  async getMenuItems(user: JwtUser, categoryId?: string, available?: boolean) {
    const vendorId = this.requireVendor(user);
    const items = await this.prisma.menuItem.findMany({
      where: {
        vendor_id: vendorId,
        is_deleted: false,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(available !== undefined ? { is_available: available } : {}),
      },
      include: {
        modifier_group_links: {
          include: { modifier_group: { include: { modifiers: true } } },
        },
        category: { select: { name: true } },
      },
      orderBy: [{ category_id: 'asc' }, { sort_order: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      category_name: item.category.name,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      prep_time_minutes: item.prep_time_minutes,
      dietary_tags: item.dietary_tags,
      allergens: item.allergens,
      is_available: item.is_available,
      modifier_groups: item.modifier_group_links.map(({ modifier_group: mg }) => ({
        id: mg.id, name: mg.name, is_required: mg.is_required,
        min_selections: mg.min_selections, max_selections: mg.max_selections,
        modifiers: mg.modifiers.map((m) => ({ id: m.id, name: m.name, price_adjustment: m.price_adjustment, is_available: m.is_available })),
      })),
    }));
  }

  async createMenuItem(user: JwtUser, dto: CreateMenuItemDto) {
    const vendorId = this.requireVendor(user);

    const item = await this.prisma.menuItem.create({
      data: {
        vendor_id: vendorId,
        category_id: dto.category_id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        prep_time_minutes: dto.prep_time_minutes,
        dietary_tags: dto.dietary_tags ?? [],
        allergens: dto.allergens ?? [],
        ...(dto.modifier_group_ids?.length
          ? { modifier_group_links: { create: dto.modifier_group_ids.map((id) => ({ modifier_group_id: id })) } }
          : {}),
      },
      include: { modifier_group_links: { include: { modifier_group: { include: { modifiers: true } } } }, category: { select: { name: true } } },
    });

    return item;
  }

  async updateMenuItem(user: JwtUser, itemId: string, dto: UpdateMenuItemDto) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);

    const { modifier_group_ids, ...rest } = dto;

    const item = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(modifier_group_ids !== undefined ? {
          modifier_group_links: {
            deleteMany: {},
            create: modifier_group_ids.map((id) => ({ modifier_group_id: id })),
          },
        } : {}),
      },
      include: { modifier_group_links: { include: { modifier_group: { include: { modifiers: true } } } }, category: { select: { name: true } } },
    });

    return item;
  }

  async deleteMenuItem(user: JwtUser, itemId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    await this.prisma.menuItem.update({ where: { id: itemId }, data: { is_deleted: true } });
    return { success: true };
  }

  async updateAvailability(user: JwtUser, itemId: string, dto: UpdateAvailabilityDto) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    return this.prisma.menuItem.update({ where: { id: itemId }, data: { is_available: dto.is_available } });
  }

  // ─── Full Menu (structured for frontend menu management) ─────────────────────

  async getMenu(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, booth_color: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const categories = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      include: {
        items: {
          where: { is_deleted: false },
          include: {
            modifier_group_links: {
              include: {
                modifier_group: {
                  include: { modifiers: { orderBy: { sort_order: 'asc' } } },
                },
              },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      vendor,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        menu_items: cat.items.map((item) => ({
          id: item.id,
          vendor_id: item.vendor_id,
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          base_price: item.price,
          image_url: item.image_url,
          is_available: item.is_available,
          is_featured: false,
          prep_time_minutes: item.prep_time_minutes,
          dietary_tags: item.dietary_tags,
          modifier_groups: item.modifier_group_links.map((link) => ({
            id: link.modifier_group.id,
            name: link.modifier_group.name,
            selection_type: link.modifier_group.max_selections > 1 ? 'multiple' : 'single',
            min_selections: link.modifier_group.min_selections,
            max_selections: link.modifier_group.max_selections,
            is_required: link.modifier_group.is_required,
            modifiers: link.modifier_group.modifiers.map((m) => ({
              id: m.id,
              name: m.name,
              price_delta: m.price_adjustment,
              is_available: m.is_available,
            })),
          })),
        })),
      })),
    };
  }

  async deleteModifierGroup(user: JwtUser, groupId: string) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.menuItemModifierGroup.deleteMany({ where: { modifier_group_id: groupId } });
    await this.prisma.modifier.deleteMany({ where: { modifier_group_id: groupId } });
    await this.prisma.modifierGroup.delete({ where: { id: groupId } });
    return { success: true };
  }

  async linkModifierGroupToItem(user: JwtUser, itemId: string, groupId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.menuItemModifierGroup.upsert({
      where: { menu_item_id_modifier_group_id: { menu_item_id: itemId, modifier_group_id: groupId } },
      create: { menu_item_id: itemId, modifier_group_id: groupId },
      update: {},
    });
    return { success: true };
  }

  async unlinkModifierGroupFromItem(user: JwtUser, itemId: string, groupId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    await this.prisma.menuItemModifierGroup.deleteMany({
      where: { menu_item_id: itemId, modifier_group_id: groupId },
    });
    return { success: true };
  }

  // ─── Categories ──────────────────────────────────────────────────────────────

  async getCategories(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const cats = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      include: { _count: { select: { items: { where: { is_deleted: false } } } } },
      orderBy: { sort_order: 'asc' },
    });
    return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, sort_order: c.sort_order, item_count: c._count.items }));
  }

  async createCategory(user: JwtUser, dto: CreateCategoryDto) {
    const vendorId = this.requireVendor(user);
    return this.prisma.menuCategory.create({
      data: {
        vendor_id: vendorId,
        name: dto.name,
        slug: dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        sort_order: dto.sort_order ?? 0,
      },
    });
  }

  async updateCategory(user: JwtUser, categoryId: string, dto: UpdateCategoryDto) {
    const vendorId = this.requireVendor(user);
    const cat = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, vendor_id: vendorId } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.menuCategory.update({ where: { id: categoryId }, data: dto });
  }

  // ─── Modifier Groups ─────────────────────────────────────────────────────────

  async createModifierGroup(user: JwtUser, dto: CreateModifierGroupDto) {
    const vendorId = this.requireVendor(user);
    return this.prisma.modifierGroup.create({
      data: {
        vendor_id: vendorId,
        name: dto.name,
        is_required: dto.is_required,
        min_selections: dto.min_selections,
        max_selections: dto.max_selections,
        modifiers: dto.modifiers?.length
          ? { create: dto.modifiers.map((m, i) => ({ name: m.name, price_adjustment: m.price_adjustment, sort_order: i })) }
          : undefined,
      },
      include: { modifiers: true },
    });
  }

  async updateModifierGroup(user: JwtUser, groupId: string, dto: UpdateModifierGroupDto) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifierGroup.update({ where: { id: groupId }, data: dto, include: { modifiers: true } });
  }

  async addModifier(user: JwtUser, groupId: string, dto: CreateModifierDto) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifier.create({ data: { modifier_group_id: groupId, name: dto.name, price_adjustment: dto.price_adjustment } });
  }

  async removeModifier(user: JwtUser, groupId: string, modifierId: string) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.modifier.delete({ where: { id: modifierId } });
    return { success: true };
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  async getSettings(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return { id: vendor.id, name: vendor.name, slug: vendor.slug, cuisine_type: vendor.cuisine_type,
      booth_number: vendor.booth_number, booth_color: vendor.booth_color, logo_url: vendor.logo_url,
      avg_prep_time_minutes: vendor.avg_prep_time_minutes, is_accepting_orders: vendor.is_accepting_orders,
      operating_hours: vendor.operating_hours, notification_preferences: vendor.notification_prefs };
  }

  async updateSettings(user: JwtUser, dto: UpdateVendorSettingsDto) {
    const vendorId = this.requireVendor(user);
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.cuisine_type ? { cuisine_type: dto.cuisine_type } : {}),
        ...(dto.booth_color ? { booth_color: dto.booth_color } : {}),
        ...(dto.avg_prep_time_minutes ? { avg_prep_time_minutes: dto.avg_prep_time_minutes } : {}),
        ...(dto.operating_hours ? { operating_hours: dto.operating_hours } : {}),
        ...(dto.notification_preferences ? { notification_prefs: dto.notification_preferences } : {}),
      },
    });
    return updated;
  }

  async updateStatus(user: JwtUser, dto: UpdateVendorStatusDto) {
    const vendorId = this.requireVendor(user);
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { is_accepting_orders: dto.is_accepting_orders, status: dto.is_accepting_orders ? 'online' : 'offline' },
    });
    return { id: updated.id, is_accepting_orders: updated.is_accepting_orders, status: updated.status };
  }

  private requireVendor(user: JwtUser): string {
    if (!user.vendor_id) throw new ForbiddenException('No vendor associated with this account');
    return user.vendor_id;
  }

  private async assertItemOwnership(vendorId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, vendor_id: vendorId, is_deleted: false } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }
}
