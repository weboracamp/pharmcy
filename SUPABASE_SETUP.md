# PharmaChain - Supabase & Vercel Setup Guide

This guide walks you through setting up the **PharmaChain Multi-Branch Pharmacy Management System** with your own Supabase project and deploying it to Vercel or any modern static/container host.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create an account.
2. Click **New Project** and choose a name (e.g., `pharmachain-prod`) and a database password.
3. Select the closest region for minimal latency.
4. Once provisioned, go to **Project Settings** > **API**:
   - Copy **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - Copy **Project API Anon Key** (`anon` / `public` key).

---

## 2. Run Database Schema & RLS Policies

1. In your Supabase Dashboard, navigate to **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open the file `supabase_schema.sql` from this repository and copy its entire contents.
4. Paste the SQL into the Supabase SQL editor and click **Run**.
5. This creates:
   - Tables: `branches`, `profiles`, `categories`, `products`, `orders`, `order_items`, `prescriptions`, `sales`, `stock_logs`, `notifications_log`, `stock_transfers`.
   - Row Level Security (RLS) policies ensuring drivers only see assigned deliveries, branch cashiers only access their branch's POS and stock, and Admins oversee all branches.

---

## 3. Configure Supabase Storage for Prescriptions

1. In your Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket**.
3. Set the bucket name to `prescriptions`.
4. Leave it as private or public depending on your clinical compliance preferences (default is private with signed URLs, or public read with RLS).
5. Add an RLS policy for the bucket:
   - Allow authenticated users or public checkout to upload (`INSERT`).
   - Allow staff (`admin`, `manager`, `cashier`, `driver`) to view prescriptions (`SELECT`).

---

## 4. Set Environment Variables

Create or update your `.env` file in the project root:

```bash
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# (Optional) WhatsApp / SMS notification gateway
VITE_TWILIO_ACCOUNT_SID=""
VITE_TWILIO_AUTH_TOKEN=""
VITE_WHATSAPP_PHONE_NUMBER=""
```

*Note: If these variables are not provided, PharmaChain automatically runs in offline-ready Demo Mode with pre-populated multi-branch inventories, orders, and simulated WhatsApp/SMS notification channels.*

---

## 5. Deploy to Vercel

1. Push this project repository to GitHub or GitLab.
2. Go to [https://vercel.com](https://vercel.com) and click **Add New...** > **Project**.
3. Import your GitHub repository.
4. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**.

---

## 6. Seed Users & Default Branch Credentials

When Supabase Auth is enabled, create user accounts with matching roles in `profiles`:

| Role | Email | Default Scope |
|---|---|---|
| **Owner / Admin** | `admin@pharmachain.com` | Full multi-branch oversight & reports |
| **Branch Cashier (Downtown)** | `cashier.downtown@pharmachain.com` | Downtown Central POS & Stock only |
| **Branch Cashier (North District)** | `cashier.north@pharmachain.com` | North District POS & Stock only |
| **Delivery Driver** | `driver.ahmed@pharmachain.com` | Mobile delivery queue & status updates |
| **Customer** | `customer@example.com` | Storefront, cart, prescription upload & order tracking |
