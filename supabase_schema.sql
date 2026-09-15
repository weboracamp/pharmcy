-- ==============================================================================
-- PharmaChain Supabase Database Schema & Row Level Security (RLS) Policies
-- Multi-Branch Pharmacy Management System with Independent Inventory & Online Store
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    address TEXT NOT NULL,
    address_ar TEXT,
    phone TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Cairo',
    is_active BOOLEAN NOT NULL DEFAULT true,
    opening_hours TEXT DEFAULT '8:00 AM - 12:00 AM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'driver', 'customer')),
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS TABLE (Independent stock per branch)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    barcode TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    min_stock_alert INTEGER NOT NULL DEFAULT 10,
    expiry_date DATE NOT NULL,
    batch_number TEXT NOT NULL,
    requires_prescription BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    description TEXT,
    description_ar TEXT,
    supplier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_barcode_per_branch UNIQUE (branch_id, barcode)
);

-- 5. ORDERS TABLE (Online customer orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'pending',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Cairo',
    payment_method TEXT NOT NULL DEFAULT 'cod',
    notes TEXT,
    requires_prescription BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 7. PRESCRIPTIONS TABLE (Linked to orders with restricted medications)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SHIFTS TABLE (Cashier shifts & cash balance tracking)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_cash_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (opening_cash_balance >= 0),
    closing_cash_balance NUMERIC(10, 2) CHECK (closing_cash_balance >= 0),
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SALES TABLE (In-store POS transactions)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no TEXT UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cashier_name TEXT NOT NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
    customer_name TEXT,
    customer_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. STOCK ADJUSTMENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    change_qty INTEGER NOT NULL,
    previous_qty INTEGER NOT NULL,
    new_qty INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('pos_sale', 'online_order', 'manual_adjustment', 'transfer_in', 'transfer_out', 'expiry_writeoff', 'restock')),
    changed_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. NOTIFICATIONS LOG TABLE (SMS & WhatsApp updates)
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
    recipient_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. STOCK TRANSFERS TABLE (Inter-branch movements)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_no TEXT UNIQUE NOT NULL,
    from_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    barcode TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_transit', 'completed')) DEFAULT 'completed',
    initiated_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current User Role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: Get Current User Branch ID
CREATE OR REPLACE FUNCTION public.get_current_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --- BRANCHES POLICIES ---
-- Everyone can read active branches (for online store branch selection)
CREATE POLICY "Public branches are viewable by all" 
ON public.branches FOR SELECT USING (true);

-- Only Admin can insert/update/delete branches
CREATE POLICY "Admins can manage branches" 
ON public.branches FOR ALL 
USING (public.get_current_role() = 'admin');

-- --- PROFILES POLICIES ---
-- Users can view their own profile; Admins can view all profiles; Branch staff can view profiles in their branch
CREATE POLICY "Users can view own profile or Admin views all" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR public.get_current_role() = 'admin' OR (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id()));

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
USING (public.get_current_role() = 'admin');

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Cashiers and Managers can create Cashier and Driver accounts for their own branch only
CREATE POLICY "Branch staff can add cashiers and drivers" 
ON public.profiles FOR INSERT 
WITH CHECK (
  public.get_current_role() IN ('manager', 'cashier') 
  AND role IN ('cashier', 'driver') 
  AND branch_id = public.get_current_branch_id()
);

-- Cashiers and Managers can remove Cashier and Driver accounts from their own branch only
CREATE POLICY "Branch staff can remove cashiers and drivers" 
ON public.profiles FOR DELETE 
USING (
  public.get_current_role() IN ('manager', 'cashier') 
  AND role IN ('cashier', 'driver') 
  AND branch_id = public.get_current_branch_id()
);

-- --- CATEGORIES POLICIES ---
-- Everyone can read categories (online store + POS)
CREATE POLICY "Categories viewable by everyone" 
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (public.get_current_role() = 'admin');

-- --- PRODUCTS POLICIES ---
-- Public can view products in stock (for online store)
CREATE POLICY "Public can view products" 
ON public.products FOR SELECT USING (true);

-- Admin can manage all products across all branches
CREATE POLICY "Admins can manage all products" 
ON public.products FOR ALL 
USING (public.get_current_role() = 'admin');

-- Branch Managers & Cashiers can insert, update, and delete products in their own branch
CREATE POLICY "Branch staff manage own branch products" 
ON public.products FOR ALL 
USING (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id())
WITH CHECK (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id());

-- --- ORDERS POLICIES ---
-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_id);

-- Customers can insert new orders
CREATE POLICY "Customers can insert orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Admin has full access to all orders
CREATE POLICY "Admin can view and manage all orders" 
ON public.orders FOR ALL 
USING (public.get_current_role() = 'admin');

-- Branch staff (manager/cashier) can only view & update orders assigned to their branch
CREATE POLICY "Branch staff view and update their branch orders" 
ON public.orders FOR ALL 
USING (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id());

-- Delivery Drivers can only view and update orders assigned to them
CREATE POLICY "Drivers view assigned orders" 
ON public.orders FOR SELECT 
USING (public.get_current_role() = 'driver' AND driver_id = auth.uid());

CREATE POLICY "Drivers update assigned order status" 
ON public.orders FOR UPDATE 
USING (public.get_current_role() = 'driver' AND driver_id = auth.uid())
WITH CHECK (public.get_current_role() = 'driver' AND driver_id = auth.uid());

-- --- ORDER ITEMS POLICIES ---
CREATE POLICY "Order items viewable with order access" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (
      o.customer_id = auth.uid() OR
      public.get_current_role() = 'admin' OR
      (public.get_current_role() IN ('manager', 'cashier') AND o.branch_id = public.get_current_branch_id()) OR
      (public.get_current_role() = 'driver' AND o.driver_id = auth.uid())
    )
  )
);

CREATE POLICY "Anyone can insert order items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- --- PRESCRIPTIONS POLICIES ---
-- Customer can view own prescription; Staff can view for their branch orders
CREATE POLICY "Prescription access scoped to order rights" 
ON public.prescriptions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = prescriptions.order_id
    AND (
      o.customer_id = auth.uid() OR
      public.get_current_role() = 'admin' OR
      (public.get_current_role() IN ('manager', 'cashier') AND o.branch_id = public.get_current_branch_id()) OR
      (public.get_current_role() = 'driver' AND o.driver_id = auth.uid())
    )
  )
);

CREATE POLICY "Anyone can insert prescription for their order" 
ON public.prescriptions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins and Managers can review prescriptions" 
ON public.prescriptions FOR UPDATE 
USING (public.get_current_role() IN ('admin', 'manager'));

-- --- SALES (POS) POLICIES ---
-- Admin can view all POS sales
CREATE POLICY "Admin view all sales" 
ON public.sales FOR SELECT 
USING (public.get_current_role() = 'admin');

-- Branch staff can view only their branch sales
CREATE POLICY "Branch staff view own branch sales" 
ON public.sales FOR SELECT 
USING (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id());

-- Cashiers and managers can insert sales for their branch
CREATE POLICY "Staff insert POS sales for own branch" 
ON public.sales FOR INSERT 
WITH CHECK (branch_id = public.get_current_branch_id() OR public.get_current_role() = 'admin');

-- --- STOCK LOGS POLICIES ---
CREATE POLICY "Admin view all stock logs" 
ON public.stock_logs FOR SELECT 
USING (public.get_current_role() = 'admin');

CREATE POLICY "Branch staff view own branch stock logs" 
ON public.stock_logs FOR SELECT 
USING (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id());

CREATE POLICY "Staff insert stock logs" 
ON public.stock_logs FOR INSERT 
WITH CHECK (true);

-- --- SHIFTS (CASHIER SESSIONS) POLICIES ---
-- Admin can view and manage all shifts across all branches
CREATE POLICY "Admin view all shifts" 
ON public.shifts FOR SELECT 
USING (public.get_current_role() = 'admin');

-- Branch staff can view shifts in their branch
CREATE POLICY "Branch staff view own branch shifts" 
ON public.shifts FOR SELECT 
USING (public.get_current_role() IN ('manager', 'cashier') AND branch_id = public.get_current_branch_id());

-- Cashiers can open a shift for themselves at their assigned branch
CREATE POLICY "Cashiers open own shift" 
ON public.shifts FOR INSERT 
WITH CHECK (
  public.get_current_role() IN ('manager', 'cashier') 
  AND cashier_id = auth.uid() 
  AND branch_id = public.get_current_branch_id()
);

-- Cashiers can close their own active shift
CREATE POLICY "Cashiers close own shift" 
ON public.shifts FOR UPDATE 
USING (
  public.get_current_role() IN ('manager', 'cashier') 
  AND cashier_id = auth.uid() 
  AND branch_id = public.get_current_branch_id()
);

-- --- STORAGE BUCKET CONFIGURATION FOR PRESCRIPTIONS ---
-- Insert prescription bucket into storage.buckets (Run via SQL editor in Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);
