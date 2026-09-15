import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Order, Branch, Profile, StockLog } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  Building2,
  FileText,
  Truck,
  ArrowRightLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  MessageSquare,
  Bike,
  ShieldCheck,
  Check,
  X,
  LogOut,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { checkTablesStatus, TableCheckResult, supabaseUrl, isSupabaseConfigured } from '../../lib/supabase';

interface AdminDashboardProps {
  onExitToStore?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExitToStore }) => {
  const {
    t,
    language,
    branches,
    addBranch,
    updateBranch,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    transferStock,
    orders,
    updateOrderStatus,
    assignDriver,
    reviewPrescription,
    sales,
    stockLogs,
    notifications,
    allProfiles,
    addProfile,
    categories,
    shifts,
    getShiftSummary,
    logoutUser
  } = usePharmacy();

  const isAr = language === 'ar';

  // Navigation tab in Admin
  const [activeTab, setActiveTab] = useState<'analytics' | 'shifts' | 'orders' | 'inventory' | 'transfers' | 'branches' | 'staff' | 'notifications' | 'database'>('analytics');

  // Supabase Table Verification State
  const [dbChecking, setDbChecking] = useState(false);
  const [dbResults, setDbResults] = useState<TableCheckResult[] | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Branch filter in Admin (can view all or specific branch)
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [viewPrescriptionOrder, setViewPrescriptionOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameAr, setNewProdNameAr] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(categories[0]?.id || '');
  const [newProdBranch, setNewProdBranch] = useState(branches[0]?.id || '');
  const [newProdPrice, setNewProdPrice] = useState(50);
  const [newProdCostPrice, setNewProdCostPrice] = useState(35);
  const [newProdQty, setNewProdQty] = useState(20);
  const [newProdMinAlert, setNewProdMinAlert] = useState(10);
  const [newProdExpiry, setNewProdExpiry] = useState('2027-12-31');
  const [newProdBatch, setNewProdBatch] = useState('BCH-2026-09');
  const [newProdRx, setNewProdRx] = useState(false);
  const [newProdSupplier, setNewProdSupplier] = useState('Pharma Global');
  const [newProdImg, setNewProdImg] = useState('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80');

  // Stock Transfer form state
  const [transferFromBranch, setTransferFromBranch] = useState(branches[0]?.id || '');
  const [transferToBranch, setTransferToBranch] = useState(branches[1]?.id || '');
  const [transferBarcode, setTransferBarcode] = useState('');
  const [transferQty, setTransferQty] = useState(10);

  // New Branch form state
  const [branchName, setBranchName] = useState('');
  const [branchNameAr, setBranchNameAr] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchAddressAr, setBranchAddressAr] = useState('');
  const [branchPhone, setBranchPhone] = useState('+20 2 ');
  const [branchCity, setBranchCity] = useState('Cairo');
  const [branchHours, setBranchHours] = useState('8:00 AM - 12:00 AM');

  // New Staff form state
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'cashier' | 'manager' | 'driver'>('cashier');
  const [staffBranch, setStaffBranch] = useState(branches[0]?.id || '');
  const [staffPhone, setStaffPhone] = useState('+20 100 ');

  // Search & filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryAlertFilter, setInventoryAlertFilter] = useState<'all' | 'low' | 'expiring'>('all');

  // Current local time is 2026-09-15. Check items expiring within 30 days (< 2026-10-15)
  const isExpiringSoon = (expiryDateStr: string) => {
    const today = new Date('2026-09-15T00:00:00Z');
    const expiry = new Date(expiryDateStr);
    const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  // Products filtered by branch
  const filteredProducts = products.filter(p => {
    const matchesBranch = selectedBranchId === 'all' || p.branch_id === selectedBranchId;
    const matchesAlert = inventoryAlertFilter === 'all'
      ? true
      : inventoryAlertFilter === 'low'
        ? p.stock_qty <= p.min_stock_alert
        : isExpiringSoon(p.expiry_date);
    const q = inventorySearch.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.batch_number.toLowerCase().includes(q);
    return matchesBranch && matchesAlert && matchesSearch;
  });

  // Sales & Orders filtered
  const filteredSales = selectedBranchId === 'all' ? sales : sales.filter(s => s.branch_id === selectedBranchId);
  const filteredOrders = selectedBranchId === 'all' ? orders : orders.filter(o => o.branch_id === selectedBranchId);

  // Financial Metrics calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0) +
                       filteredOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);

  const lowStockCount = products.filter(p => (selectedBranchId === 'all' || p.branch_id === selectedBranchId) && p.stock_qty <= p.min_stock_alert).length;
  const expiringSoonCount = products.filter(p => (selectedBranchId === 'all' || p.branch_id === selectedBranchId) && isExpiringSoon(p.expiry_date)).length;

  // Best selling items
  const itemSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredSales.forEach(s => {
    s.items.forEach(it => {
      if (!itemSalesMap[it.product_id]) {
        itemSalesMap[it.product_id] = { name: it.name, qty: 0, revenue: 0 };
      }
      itemSalesMap[it.product_id].qty += it.quantity;
      itemSalesMap[it.product_id].revenue += it.total;
    });
  });
  const bestSellers = Object.values(itemSalesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Branch Comparison Stats
  const branchComparison = branches.map(b => {
    const bSales = sales.filter(s => s.branch_id === b.id).reduce((sum, s) => sum + s.total, 0);
    const bOrders = orders.filter(o => o.branch_id === b.id).length;
    const bProducts = products.filter(p => p.branch_id === b.id);
    const bStockCount = bProducts.reduce((sum, p) => sum + p.stock_qty, 0);
    return {
      branch: b,
      revenue: bSales,
      ordersCount: bOrders,
      totalUnits: bStockCount
    };
  });

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      branch_id: newProdBranch,
      name: newProdName,
      name_ar: newProdNameAr || newProdName,
      category_id: newProdCategory,
      barcode: newProdBarcode,
      price: Number(newProdPrice),
      cost_price: Number(newProdCostPrice),
      stock_qty: Number(newProdQty),
      min_stock_alert: Number(newProdMinAlert),
      expiry_date: newProdExpiry,
      batch_number: newProdBatch,
      requires_prescription: newProdRx,
      supplier: newProdSupplier,
      image_url: newProdImg,
      description: 'Pharmaceutical medication standard inventory',
      description_ar: 'دواء صيدلاني قياسي'
    });
    setShowAddProductModal(false);
  };

  // Handle Stock Transfer
  const handleStockTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFromBranch === transferToBranch) {
      alert('Source and destination branches must be different!');
      return;
    }
    const success = transferStock({
      from_branch_id: transferFromBranch,
      to_branch_id: transferToBranch,
      product_id: '',
      product_name: 'Transferred Stock',
      barcode: transferBarcode,
      quantity: Number(transferQty),
      status: 'completed',
      initiated_by: 'Dr. Kareem Mansour (Admin)'
    });
    if (success) {
      setShowTransferModal(false);
    }
  };

  // Handle Add Branch
  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBranch({
      name: branchName,
      name_ar: branchNameAr,
      address: branchAddress,
      address_ar: branchAddressAr,
      phone: branchPhone,
      city: branchCity,
      is_active: true,
      opening_hours: branchHours
    });
    setShowAddBranchModal(false);
  };

  // Handle Add Staff
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProfile({
      email: staffEmail,
      full_name: staffName,
      role: staffRole,
      branch_id: staffRole === 'driver' ? null : staffBranch,
      phone: staffPhone,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    });
    setShowAddStaffModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Admin Top Header & Branch Scope Filter */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight">
              {isAr ? 'لوحة القيادة الإدارية المركزية' : 'Executive Pharmacy Admin Console'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAr ? 'إشراف كامل على سلاسل الفروع، المخزون المستقل، الطلبات، والمناديب' : 'Full multi-branch inventory, analytics, order fulfillment, and staff governance'}
          </p>
        </div>

        {/* Actions: Branch Scope + Exit to Store */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Branch Filter for Admin */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <Building2 className="w-4 h-4 text-teal-400 ms-1.5" />
            <span className="text-xs font-semibold text-slate-300">{isAr ? 'نطاق العرض:' : 'Branch Scope:'}</span>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-700 outline-none cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع الفروع (شبكة كاملة)' : 'All Branches (Consolidated)'}</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {isAr ? b.name_ar : b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exit to Public Store button */}
          <button
            onClick={async () => {
              if (onExitToStore) {
                onExitToStore();
              } else {
                window.location.hash = '';
                await logoutUser();
              }
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 min-h-[44px]"
            title={isAr ? 'خروج والعودة للمتجر العام' : 'Exit to Public Store'}
          >
            <LogOut className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? 'خروج للمتجر' : 'Exit to Store'}</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'analytics', labelEn: 'Reports & Analytics', labelAr: 'التقارير والإحصائيات', icon: BarChart3 },
          { id: 'shifts', labelEn: `Cashier Shifts (${shifts.length})`, labelAr: `شيفتات الكاشير (${shifts.length})`, icon: Clock },
          { id: 'orders', labelEn: `Online Orders (${orders.length})`, labelAr: `الطلبات أونلاين (${orders.length})`, icon: Truck },
          { id: 'inventory', labelEn: 'Branch Inventory', labelAr: 'مخزون الفروع', icon: Package },
          { id: 'transfers', labelEn: 'Stock Transfers & Logs', labelAr: 'التحويلات وسجل التعديلات', icon: ArrowRightLeft },
          { id: 'branches', labelEn: `Branches (${branches.length})`, labelAr: `إدارة الفروع (${branches.length})`, icon: Building2 },
          { id: 'staff', labelEn: `Staff & Drivers (${allProfiles.length})`, labelAr: `الموظفون والمناديب (${allProfiles.length})`, icon: Users },
          { id: 'notifications', labelEn: `Alerts Log (${notifications.length})`, labelAr: `سجل الإشعارات (${notifications.length})`, icon: MessageSquare },
          { id: 'database', labelEn: 'Supabase Database', labelAr: 'قاعدة بيانات Supabase', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REPORTS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {totalRevenue.toFixed(2)} <span className="text-xs font-normal">EGP</span>
                  </p>
                </div>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% {isAr ? 'عن الشهر الماضي' : 'vs last period'}</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'طلبات التوصيل' : 'Online Orders'}</span>
                  <p className="text-2xl font-black text-slate-900 font-mono mt-1">
                    {filteredOrders.length}
                  </p>
                </div>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Truck className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {filteredOrders.filter(o => o.status === 'delivered').length} {isAr ? 'تم تسليمها بنجاح' : 'fulfilled successfully'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'نواقص المخزون' : 'Low Stock Alert'}</span>
                  <p className="text-2xl font-black text-amber-600 font-mono mt-1">
                    {lowStockCount}
                  </p>
                </div>
                <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-amber-700 mt-2">
                {isAr ? 'أصناف أقل من حد الأمان' : 'Items below threshold'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'أوشك على الانتهاء' : 'Expiring Soon'}</span>
                  <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                    {expiringSoonCount}
                  </p>
                </div>
                <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
              </div>
              <p className="text-[11px] text-rose-700 mt-2">
                {isAr ? 'تنتهي خلال ٣٠ يوماً' : 'Expires within 30 days'}
              </p>
            </div>
          </div>

          {/* Branch Comparison Table & Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>{isAr ? 'مقارنة أداء الفروع وحجم المخزون المستقل' : 'Branch Performance Comparison & Independent Stock Metrics'}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'الفرع' : 'Branch'}</th>
                    <th className="p-3 text-start">{isAr ? 'مبيعات الكاشير' : 'POS Sales'}</th>
                    <th className="p-3 text-start">{isAr ? 'طلبات التوصيل' : 'Online Orders'}</th>
                    <th className="p-3 text-start">{isAr ? 'إجمالي الوحدات في المخزن' : 'Stock Units'}</th>
                    <th className="p-3 text-start">{isAr ? 'الحالة التشغيلية' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchComparison.map(stat => (
                    <tr key={stat.branch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">
                        {isAr ? stat.branch.name_ar : stat.branch.name}
                        <span className="text-[10px] text-slate-400 block font-normal">{stat.branch.address}</span>
                      </td>
                      <td className="p-3 font-black text-teal-700 font-mono">
                        {stat.revenue.toFixed(2)} EGP
                      </td>
                      <td className="p-3 font-bold text-slate-700">
                        {stat.ordersCount} orders
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {stat.totalUnits} units
                      </td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {stat.branch.is_active ? 'Active' : 'Offline'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Selling Products */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>{isAr ? 'الأدوية الأكثر مبيعاً في الشبكة' : 'Top Dispensed Medications (Fast Movers)'}</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {bestSellers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No sales recorded yet.</p>
              ) : (
                bestSellers.map((item, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.qty} units dispensed</p>
                      </div>
                    </div>
                    <span className="font-black text-teal-700 font-mono">
                      {item.revenue.toFixed(2)} EGP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SHIFTS AUDIT & RECONCILIATION */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                {isAr ? 'مراقبة وتدقيق شيفتات الكاشير بالفروع' : 'Branch Cashier Shifts & Drawer Reconciliation'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'متابعة العهد النقدية، مبيعات الجلسات، والفروقات بين النقدية المتوقعة والفعلية' : 'Audit opening balances, cash drawer counts, card collections, and discrepancies'}
              </p>
            </div>
            <div className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {shifts.filter(s => selectedBranchId === 'all' || s.branch_id === selectedBranchId).length} {isAr ? 'جلسة مسجلة' : 'shifts logged'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts
              .filter(s => selectedBranchId === 'all' || s.branch_id === selectedBranchId)
              .map((shift) => {
                const shiftSummary = getShiftSummary(shift.id);
                const branchObj = branches.find(b => b.id === shift.branch_id);
                const isOpen = shift.status === 'open';
                const variance = shift.closing_cash_balance !== null 
                  ? shift.closing_cash_balance - shiftSummary.expectedCash 
                  : null;

                return (
                  <div key={shift.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <h4 className="font-bold text-sm text-slate-900">{shift.cashier_name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {shift.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {branchObj ? (isAr ? branchObj.name_ar : branchObj.name) : shift.branch_id}
                        </p>
                      </div>

                      <div className="text-end text-[11px] text-slate-400">
                        <p>{new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                        {shift.closed_at && (
                          <p className="text-slate-500">
                            {isAr ? 'إغلاق:' : 'Closed:'} {new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Financial grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-sans">{isAr ? 'عهدة بداية' : 'Opening'}</span>
                        <span className="font-bold text-slate-800">{shift.opening_cash_balance.toFixed(2)}</span>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 block font-sans">{isAr ? 'مبيعات كاش' : 'Cash Sales'}</span>
                        <span className="font-bold text-emerald-800">+{shiftSummary.cashSales.toFixed(2)}</span>
                      </div>
                      <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                        <span className="text-[10px] text-blue-600 block font-sans">{isAr ? 'فيزا / بطاقة' : 'Card'}</span>
                        <span className="font-bold text-blue-800">{shiftSummary.cardSales.toFixed(2)}</span>
                      </div>
                      <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                        <span className="text-[10px] text-teal-700 block font-sans">{isAr ? 'المتوقع بالدرج' : 'Expected'}</span>
                        <span className="font-black text-teal-900">{shiftSummary.expectedCash.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Closing Cash & Variance */}
                    {shift.closing_cash_balance !== null && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500">{isAr ? 'النقدية المحصية عند الإغلاق:' : 'Counted Closing Cash:'} </span>
                          <span className="font-mono font-bold text-slate-900">{shift.closing_cash_balance.toFixed(2)} EGP</span>
                        </div>

                        {variance !== null && (
                          <div>
                            {Math.abs(variance) < 0.01 ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                                {isAr ? '✓ متطابق تماماً' : '✓ Balanced'}
                              </span>
                            ) : variance > 0 ? (
                              <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                                {isAr ? `+ زيادة: ${variance.toFixed(2)} EGP` : `+ Over: ${variance.toFixed(2)} EGP`}
                              </span>
                            ) : (
                              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
                                {isAr ? `- عجز: ${Math.abs(variance).toFixed(2)} EGP` : `- Short: ${Math.abs(variance).toFixed(2)} EGP`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {shift.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                        "{shift.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: ONLINE ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {isAr ? 'إدارة ومراجعة طلبات التوصيل المركزية' : 'Central Order Fulfillment & Dispatch'}
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {orders.length} {isAr ? 'طلب مسجل' : 'total orders'}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">Order #</th>
                    <th className="p-3 text-start">Customer</th>
                    <th className="p-3 text-start">Branch</th>
                    <th className="p-3 text-start">Prescription</th>
                    <th className="p-3 text-start">Assigned Driver</th>
                    <th className="p-3 text-start">Total (COD)</th>
                    <th className="p-3 text-start">Status</th>
                    <th className="p-3 text-start">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map(order => {
                    const branch = branches.find(b => b.id === order.branch_id);
                    const driver = allProfiles.find(p => p.id === order.driver_id);
                    const availableDrivers = allProfiles.filter(p => p.role === 'driver');

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-black text-slate-900 font-mono">{order.order_number}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{order.customer_name}</p>
                          <p className="text-[11px] text-slate-500">{order.customer_phone}</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {branch?.name}
                        </td>
                        <td className="p-3">
                          {order.requires_prescription ? (
                            order.prescription ? (
                              <button
                                onClick={() => setViewPrescriptionOrder(order)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                  order.prescription.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.prescription.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800 animate-pulse'
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{order.prescription.status.toUpperCase()}</span>
                              </button>
                            ) : (
                              <span className="text-rose-600 font-bold text-[10px]">Missing File</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-[10px]">None (OTC)</span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={order.driver_id || ''}
                            onChange={(e) => assignDriver(order.id, e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            <option value="">Unassigned</option>
                            {availableDrivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.full_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 font-black text-teal-700 font-mono">
                          {order.total.toFixed(2)} EGP
                        </td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                            className={`border rounded-lg px-2 py-1 text-xs font-bold ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              order.status === 'out_for_delivery' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                              order.status === 'confirmed' ? 'bg-teal-50 text-teal-800 border-teal-300' :
                              'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="out_for_delivery">Out for delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3">
                          {order.prescription && (
                            <button
                              onClick={() => setViewPrescriptionOrder(order)}
                              className="text-teal-600 hover:text-teal-800 font-bold text-xs underline cursor-pointer"
                            >
                              Review Rx
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCH INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory by name, barcode, batch..."
                  className="w-full ps-9 pe-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Alert Filter */}
              <select
                value={inventoryAlertFilter}
                onChange={(e) => setInventoryAlertFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-xl text-xs px-2.5 py-2 font-medium"
              >
                <option value="all">All Items</option>
                <option value="low">Low Stock Only</option>
                <option value="expiring">Expiring Soon (&lt;30d)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحويل بضاعة بين الفروع' : 'Transfer Stock'}</span>
              </button>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة صنف جديد' : 'Add Medication'}</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">Medication</th>
                    <th className="p-3 text-start">Branch</th>
                    <th className="p-3 text-start">Barcode</th>
                    <th className="p-3 text-start">Batch #</th>
                    <th className="p-3 text-start">Expiry Date</th>
                    <th className="p-3 text-start">Stock Qty</th>
                    <th className="p-3 text-start">Price</th>
                    <th className="p-3 text-start">Cost</th>
                    <th className="p-3 text-start">Rx Req</th>
                    <th className="p-3 text-start">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(prod => {
                    const branch = branches.find(b => b.id === prod.branch_id);
                    const isLow = prod.stock_qty <= prod.min_stock_alert;
                    const isExp = isExpiringSoon(prod.expiry_date);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">
                          {isAr && prod.name_ar ? prod.name_ar : prod.name}
                          <span className="text-[10px] text-slate-400 block font-normal">{prod.supplier}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {branch?.name}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{prod.barcode}</td>
                        <td className="p-3 font-mono text-slate-600">{prod.batch_number}</td>
                        <td className="p-3 font-mono">
                          <span className={isExp ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {prod.expiry_date}
                          </span>
                          {isExp && <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded ms-1">EXP</span>}
                        </td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded ${
                            isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {prod.stock_qty}
                          </span>
                        </td>
                        <td className="p-3 font-black font-mono text-teal-700">{prod.price.toFixed(2)}</td>
                        <td className="p-3 font-mono text-slate-500">{prod.cost_price.toFixed(2)}</td>
                        <td className="p-3">
                          {prod.requires_prescription ? (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">Rx</span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">OTC</span>
                          )}
                        </td>
                        <td className="p-3 flex items-center gap-1.5">
                          <button
                            onClick={() => adjustStock(prod.id, 10, 'restock')}
                            className="text-emerald-700 font-bold hover:underline"
                            title="Quick Restock +10"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => deleteProduct(prod.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK TRANSFERS & AUDIT LOGS */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {isAr ? 'سجل تحركات وتعديلات المخزون (Stock Audit Trail)' : 'Stock Adjustments & Audit Trail'}
            </h2>
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Initiate Branch Transfer</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">Timestamp</th>
                  <th className="p-3 text-start">Product</th>
                  <th className="p-3 text-start">Branch</th>
                  <th className="p-3 text-start">Change</th>
                  <th className="p-3 text-start">Previous → New</th>
                  <th className="p-3 text-start">Reason</th>
                  <th className="p-3 text-start">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{log.product_name}</td>
                    <td className="p-3 text-slate-700">{log.branch_name}</td>
                    <td className="p-3 font-black">
                      <span className={log.change_qty < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {log.change_qty > 0 ? `+${log.change_qty}` : log.change_qty}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {log.previous_qty} → {log.new_qty}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {log.reason.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">{log.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BRANCHES MANAGEMENT */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {isAr ? 'الفروع التابعة لشبكة الصيدلية (2–5 فروع)' : 'Pharmacy Chain Branches (2–5 Active Units)'}
            </h2>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map(b => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{b.name}</h3>
                    <p className="text-xs text-slate-500">{b.name_ar}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p><strong>Address:</strong> {b.address}, {b.city}</p>
                  <p><strong>Phone:</strong> {b.phone}</p>
                  <p><strong>Hours:</strong> {b.opening_hours}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                  <span>Inventory: {products.filter(p => p.branch_id === b.id).length} SKUs</span>
                  <span className="text-teal-600 font-bold">Independent Stock</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STAFF & EMPLOYEES */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              {isAr ? 'فريق العمل والمناديب وتوزيع الفروع' : 'Branch Staff, Cashiers & Delivery Couriers'}
            </h2>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff Account</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProfiles.map(staff => {
              const branch = branches.find(b => b.id === staff.branch_id);
              return (
                <div key={staff.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <img
                    src={staff.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={staff.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">{staff.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{staff.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {staff.role}
                      </span>
                      {branch && (
                        <span className="text-[10px] text-teal-700 font-semibold truncate">
                          {branch.name.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS LOG */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {isAr ? 'سجل رسائل واتساب والرسائل القصيرة الآلية' : 'Automated WhatsApp & SMS Gateway Activity Log'}
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">Time</th>
                  <th className="p-3 text-start">Order #</th>
                  <th className="p-3 text-start">Channel</th>
                  <th className="p-3 text-start">Recipient Phone</th>
                  <th className="p-3 text-start">Message Content</th>
                  <th className="p-3 text-start">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <tr key={notif.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(notif.sent_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-black font-mono text-slate-900">{notif.order_number}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        notif.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notif.channel}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{notif.recipient_phone}</td>
                    <td className="p-3 text-slate-800 max-w-md">{notif.message}</td>
                    <td className="p-3">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                        {notif.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 9: SUPABASE DATABASE & CLOUD SYNCHRONIZATION */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Connection Overview Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isAr ? 'حالة قاعدة بيانات Supabase والسحابة' : 'Supabase Cloud Database & RLS Audit'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {supabaseUrl || 'https://duudldtipunoaejqvnkf.supabase.co'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setDbChecking(true);
                    const res = await checkTablesStatus();
                    setDbResults(res.tables);
                    setDbChecking(false);
                  }}
                  disabled={dbChecking}
                  className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer shadow-xs min-h-[40px]"
                >
                  <RefreshCw className={`w-4 h-4 ${dbChecking ? 'animate-spin' : ''}`} />
                  <span>{dbChecking ? (isAr ? 'جاري الفحص...' : 'Auditing...') : (isAr ? 'إعادة فحص الجداول و RLS' : 'Run Live Table & RLS Audit')}</span>
                </button>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px] mb-1">
                  {isAr ? 'عنوان المشروع (Project URL):' : 'Project URL (VITE_SUPABASE_URL):'}
                </span>
                <span className="font-mono font-bold text-slate-800 text-[11px] break-all">
                  {supabaseUrl || 'https://duudldtipunoaejqvnkf.supabase.co'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px] mb-1">
                  {isAr ? 'المفتاح العام (Anon/Public Key):' : 'Public Anon Key (VITE_SUPABASE_ANON_KEY):'}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isSupabaseConfigured() ? (isAr ? 'مُعرّف ومحمّل من .env' : 'Configured via .env') : 'Missing'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px] mb-1">
                  {isAr ? 'حماية الصفوف (RLS Enforcement):' : 'Row Level Security Policy:'}
                </span>
                <div className="flex items-center gap-1.5 font-bold text-teal-700">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'مفعل على جميع الجداول 100%' : 'Required ON for all 12 tables'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Required / Info Banner */}
          {(!dbResults || dbResults.some(t => !t.exists)) && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-amber-900 text-sm">
                    {isAr ? 'الربط جاهز - مطلوب تشغيل كود المايجريشن (SQL Schema)' : 'Supabase Connected - Run Database Schema Migration'}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {isAr
                      ? 'تم ربط المتغيرات VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بنجاح. نظراً لأن مفتاح Anon العام مصمم للأمان ولا يملك صلاحية إنشاء الجداول DDL، يجب تطبيق ملف supabase_schema.sql في محرر SQL بمشروعك في Supabase لإنشاء الجداول وسياسات الـ RLS.'
                      : 'The project URL and Anon key are safely loaded from environment variables. For database security, Supabase prevents anon keys from running arbitrary DDL (CREATE TABLE). Run supabase_schema.sql in your Supabase SQL Editor once to create all 12 tables and activate Row Level Security.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://supabase.com/dashboard/project/duudldtipunoaejqvnkf/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح محرر SQL في Supabase' : 'Open Supabase SQL Editor'}</span>
                </a>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/supabase_schema.sql');
                      const sql = await res.text();
                      await navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    } catch {
                      // Fallback copy message
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? (isAr ? 'تم نسخ الـ SQL!' : 'SQL Schema Copied!') : (isAr ? 'نسخ كود SQL Schema' : 'Copy supabase_schema.sql')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Table by Table Audit List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  {isAr ? 'تدقيق جداول النظام الـ 12 وحالة أمان RLS' : '12 Core System Tables & RLS Status Audit'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'كل جدول محمي بسياسات عزل الصلاحيات حسب الفرع والدور' : 'Each table isolated with branch and role-scoped RLS policies'}
                </p>
              </div>

              {!dbResults && (
                <button
                  onClick={async () => {
                    setDbChecking(true);
                    const res = await checkTablesStatus();
                    setDbResults(res.tables);
                    setDbChecking(false);
                  }}
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {isAr ? 'فحص الآن' : 'Check Now'}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 text-start">#</th>
                    <th className="p-3.5 text-start">{isAr ? 'اسم الجدول' : 'Table Name'}</th>
                    <th className="p-3.5 text-start">{isAr ? 'الوجود في السكيما' : 'Schema Existence'}</th>
                    <th className="p-3.5 text-start">{isAr ? 'رمز استجابة REST' : 'REST Status'}</th>
                    <th className="p-3.5 text-start">{isAr ? 'حالة أمان RLS' : 'Row Level Security (RLS)'}</th>
                    <th className="p-3.5 text-start">{isAr ? 'سياسة الحماية المطبقة' : 'RLS Protection Scope'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'branches', policy: 'Public SELECT; Admin manage' },
                    { name: 'profiles', policy: 'Owner & Branch staff scoped' },
                    { name: 'categories', policy: 'Public SELECT; Admin manage' },
                    { name: 'products', policy: 'Public SELECT; Branch staff manage' },
                    { name: 'orders', policy: 'Customer own / Staff branch / Driver assigned' },
                    { name: 'order_items', policy: 'Scoped to order access permissions' },
                    { name: 'prescriptions', policy: 'Scoped to order access permissions' },
                    { name: 'shifts', policy: 'Branch staff / Cashier own shift' },
                    { name: 'sales', policy: 'Branch staff / Cashier own branch' },
                    { name: 'stock_logs', policy: 'Branch staff / Admin audit log' },
                    { name: 'notifications_log', policy: 'Admin & System automated notifications' },
                    { name: 'stock_transfers', policy: 'Inter-branch staff scoped transfers' }
                  ].map((tbl, idx) => {
                    const checkResult = dbResults?.find(r => r.table === tbl.name);
                    const exists = checkResult?.exists;
                    const status = checkResult?.status;

                    return (
                      <tr key={tbl.name} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-black font-mono text-slate-900">{tbl.name}</td>
                        <td className="p-3.5">
                          {checkResult ? (
                            exists ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                                <CheckCircle2 className="w-3 h-3" />
                                {isAr ? 'موجود بالسكيما' : 'Present'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                                <Clock className="w-3 h-3" />
                                {isAr ? 'بانتظار تشغيل SQL' : 'Pending SQL Run'}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">
                              {isAr ? 'اضغط فحص' : 'Ready to audit'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono">
                          {status ? (
                            <span className={status === 200 ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                              HTTP {status}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            <span>ON (ENABLE ROW LEVEL SECURITY)</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">
                          {tbl.policy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Prescription Modal */}
      {viewPrescriptionOrder && viewPrescriptionOrder.prescription && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900">Review Patient Medical Prescription</h3>
                <p className="text-xs text-slate-500 font-mono">Order {viewPrescriptionOrder.order_number}</p>
              </div>
              <button onClick={() => setViewPrescriptionOrder(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Uploaded Prescription Document:</span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72">
                <img
                  src={viewPrescriptionOrder.prescription.file_url}
                  alt="Prescription Scan"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <p><strong>Customer:</strong> {viewPrescriptionOrder.customer_name} ({viewPrescriptionOrder.customer_phone})</p>
              <p><strong>Current Status:</strong> {viewPrescriptionOrder.prescription.status.toUpperCase()}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  reviewPrescription(viewPrescriptionOrder.id, 'rejected', 'Illegible or expired prescription');
                  setViewPrescriptionOrder(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reject Prescription
              </button>
              <button
                onClick={() => {
                  reviewPrescription(viewPrescriptionOrder.id, 'approved');
                  setViewPrescriptionOrder(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Approve & Pack Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-teal-600" />
                Inter-Branch Stock Movement
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleStockTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Branch (From):</label>
                <select
                  value={transferFromBranch}
                  onChange={(e) => setTransferFromBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Branch (To):</label>
                <select
                  value={transferToBranch}
                  onChange={(e) => setTransferToBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Barcode:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 622100100121 (Augmentin)"
                  value={transferBarcode}
                  onChange={(e) => setTransferBarcode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Transfer:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="w-1/3 py-2 border rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900">Add Medication to Branch Inventory</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Name (English):</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Amoxil 500mg"
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Name (Arabic):</label>
                  <input
                    type="text"
                    value={newProdNameAr}
                    onChange={(e) => setNewProdNameAr(e.target.value)}
                    placeholder="اموكسيل ٥٠٠ مجم"
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Branch:</label>
                  <select
                    value={newProdBranch}
                    onChange={(e) => setNewProdBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Category:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Barcode:</label>
                  <input
                    type="text"
                    required
                    value={newProdBarcode}
                    onChange={(e) => setNewProdBarcode(e.target.value)}
                    placeholder="622..."
                    className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Price (EGP):</label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Cost Price:</label>
                  <input
                    type="number"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold block mb-1">Initial Stock:</label>
                  <input
                    type="number"
                    value={newProdQty}
                    onChange={(e) => setNewProdQty(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Expiry Date:</label>
                  <input
                    type="date"
                    value={newProdExpiry}
                    onChange={(e) => setNewProdExpiry(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Batch #:</label>
                  <input
                    type="text"
                    value={newProdBatch}
                    onChange={(e) => setNewProdBatch(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req-rx-check"
                  checked={newProdRx}
                  onChange={(e) => setNewProdRx(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <label htmlFor="req-rx-check" className="font-bold text-slate-800">
                  Requires Doctor's Medical Prescription (Rx Restricted)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/3 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900">Add New Pharmacy Branch</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Branch Name (English):</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Airport Plaza Branch"
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Branch Name (Arabic):</label>
                <input
                  type="text"
                  value={branchNameAr}
                  onChange={(e) => setBranchNameAr(e.target.value)}
                  placeholder="فرع المطار بلازا"
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address:</label>
                <input
                  type="text"
                  required
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Street & Area"
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Phone:</label>
                  <input
                    type="text"
                    required
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">City:</label>
                  <input
                    type="text"
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="w-1/3 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900">Create Staff / Driver Account</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Pharm. Marwa Salem"
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="marwa@pharmachain.com"
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Role:</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    <option value="cashier">Branch Cashier</option>
                    <option value="manager">Branch Manager</option>
                    <option value="driver">Delivery Driver</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Assigned Branch:</label>
                  <select
                    value={staffBranch}
                    onChange={(e) => setStaffBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="w-1/3 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
