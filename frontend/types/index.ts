export interface Vendor {
  id: string;
  name: string;
  slug: string;
  cuisine_type: string;
  booth_number: number;
  booth_color: string;
  description: string | null;
  logo_url: string | null;
  avg_prep_time_minutes: number;
  is_accepting_orders: boolean;
  status: 'active' | 'inactive' | 'suspended';
}

export interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
  menu_items: MenuItem[];
}

export interface MenuItem {
  id: string;
  vendor_id: string;
  category_id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  dietary_tags: string[];
  prep_time_minutes: number | null;
  modifier_groups: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  selection_type: 'single' | 'multiple';
  min_selections: number;
  max_selections: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface CartItem {
  itemKey: string;
  menuItemId: string;
  vendorId: string;
  vendorName: string;
  vendorColor: string;
  itemName: string;
  unitPrice: number;
  selectedModifiers: { modifierId: string; name: string; priceDelta: number }[];
  quantity: number;
  specialInstructions: string;
}

export interface OrderItem {
  vendor_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  modifiers: { modifier_id: string }[];
  special_instructions?: string;
}

export interface Order {
  id: string;
  token_number: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  vendor_items: {
    vendor_id: string;
    vendor_name: string;
    status: OrderStatus;
  }[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'partially_ready'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrderItemStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'rejected';

export interface KDSOrder {
  order_item_id: string;
  order_id: string;
  token_number: number;
  table_number: string | null;
  item_name: string;
  quantity: number;
  modifiers: { name: string; type: 'add' | 'remove' }[];
  special_instructions: string | null;
  status: OrderItemStatus;
  accepted_at: string | null;
  created_at: string;
  estimated_prep_time_minutes: number | null;
}

export interface Session {
  id: string;
  table_id: string | null;
  table_number: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface DisplayBoardVendor {
  vendor_id: string;
  vendor_name: string;
  booth_color: string;
  preparing: number[];
  ready: number[];
}

// ─── Admin / Phase 3 types ────────────────────────────────────────────────────

export interface AdminOverview {
  orders_today: number;
  revenue_today: number;
  orders_this_week: number;
  revenue_this_week: number;
  active_vendors: number;
  avg_prep_time: number;
}

export interface AdminVendor {
  id: string;
  name: string;
  cuisine_type: string;
  booth_number: number;
  booth_color: string;
  status: 'online' | 'offline' | 'suspended';
  is_accepting_orders: boolean;
  staff_count: number;
  revenue_today: number;
  order_count_today: number;
}

export interface AdminOrder {
  id: string;
  token_number: number;
  table_number: number | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  item_count: number;
  items: AdminOrderItem[];
  created_at: string;
}

export interface AdminOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  total_price: number;
  status: OrderItemStatus;
  vendor: { name: string; booth_color: string };
}

export interface Promotion {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  vendor_id: string | null;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
}

export interface CashLog {
  id: string;
  order_id: string;
  token_number: number;
  amount: number;
  collected_by: string;
  notes: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  order_count: number;
}

export interface PeakHourPoint {
  day_of_week: number;
  hour: number;
  count: number;
}
