export interface Vendor {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  location: string | null;
  hours: string | null;
  prep_time: string | null;
  created_at: string;
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
  image_url: string | null;
  is_available: boolean;
}

export type OrderStatus = "pending_payment" | "paid" | "preparing" | "ready" | "completed" | "cancelled";
export type FulfillmentType = "pickup" | "delivery";

export interface Order {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: FulfillmentType;
  delivery_address: string | null;
  status: OrderStatus;
  subtotal: string;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  price: string;
  quantity: number;
}

export interface JwtPayload {
  vendor_id: string;
  slug: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
}
