export type UserRole = 'admin' | 'manager' | 'cashier' | 'driver' | 'customer';

export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type PrescriptionStatus = 'pending' | 'approved' | 'rejected';

export interface Branch {
  id: string;
  name: string;
  name_ar: string;
  address: string;
  address_ar: string;
  phone: string;
  city: string;
  is_active: boolean;
  opening_hours: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id?: string | null;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon?: string;
  item_count?: number;
}

export interface Product {
  id: string;
  branch_id: string;
  name: string;
  name_ar: string;
  category_id: string;
  category_name?: string;
  barcode: string;
  price: number;
  cost_price: number;
  stock_qty: number;
  min_stock_alert: number;
  expiry_date: string;
  batch_number: string;
  requires_prescription: boolean;
  image_url: string;
  description: string;
  description_ar: string;
  supplier: string;
  dosage?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_name_ar?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  requires_prescription?: boolean;
}

export interface Prescription {
  id: string;
  order_id: string;
  file_url: string;
  file_name: string;
  status: PrescriptionStatus;
  reviewed_by?: string | null;
  rejection_reason?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  branch_id: string;
  driver_id?: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  city: string;
  payment_method: 'cod';
  notes?: string;
  requires_prescription: boolean;
  prescription?: Prescription | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  product_id: string;
  barcode: string;
  name: string;
  name_ar: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Shift {
  id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string | null;
  opening_cash_balance: number;
  closing_cash_balance?: number | null;
  status: 'open' | 'closed';
  notes?: string;
  created_at?: string;
}

export interface Sale {
  id: string;
  receipt_no: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string;
  shift_id?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'card';
  tendered_amount?: number;
  change_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
}

export interface StockLog {
  id: string;
  product_id: string;
  product_name: string;
  branch_id: string;
  branch_name?: string;
  change_qty: number;
  previous_qty: number;
  new_qty: number;
  reason: 'pos_sale' | 'online_order' | 'manual_adjustment' | 'transfer_in' | 'transfer_out' | 'expiry_writeoff' | 'restock';
  changed_by: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  order_id: string;
  order_number: string;
  channel: 'whatsapp' | 'sms';
  recipient_phone: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface StockTransfer {
  id: string;
  transfer_no: string;
  from_branch_id: string;
  to_branch_id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  quantity: number;
  status: 'completed' | 'in_transit' | 'pending';
  initiated_by: string;
  created_at: string;
}

export type Language = 'en' | 'ar';
