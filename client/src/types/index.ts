export interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  location: string | null;
  hours: string | null;
  prep_time: string | null;
  created_at: string;
  public_url?: string;
}

export interface Category {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  order_index: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: string;
  original_price: string | null;
  image_url: string | null;
  is_available: boolean;
}

export interface CategoryWithItems extends Category {
  items: MenuItem[];
}

export interface PublicMenu {
  vendor: Vendor;
  categories: CategoryWithItems[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

export interface AuthResponse {
  token: string;
  vendor: Vendor;
}

export type OrderStatus = "pending_payment" | "paid" | "preparing" | "ready" | "completed" | "cancelled";
export type FulfillmentType = "pickup" | "delivery";

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: string;
  image_url: string | null;
  quantity: number;
}

export interface OrderItem {
  name: string;
  price: string;
  quantity: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  subtotal: string;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  paid_at: string | null;
  vendor: { business_name: string; logo_url: string | null; slug: string } | null;
  items: OrderItem[];
}

export interface VendorOrder {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  status: OrderStatus;
  subtotal: string;
  paid_at: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  vendor_slug: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  delivery_address?: string;
  items: { menu_item_id: string; quantity: number }[];
}

export interface CreateOrderResponse {
  order_id: string;
  authorization_url: string;
}
