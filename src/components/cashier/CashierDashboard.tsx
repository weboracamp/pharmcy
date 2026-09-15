import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Order, Sale, Shift, Profile, StockLog } from '../../types';
import { ThermalReceipt } from '../pos/ThermalReceipt';
import {
  Building2,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ShoppingCart,
  Printer,
  Calendar,
  Lock,
  Bike,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  DollarSign,
  ArrowRightLeft,
  RotateCcw,
  Sparkles,
  LogOut,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface CashierDashboardProps {
  onOpenPOS: () => void;
  onExitToStore?: () => void;
}

export const CashierDashboard: React.FC<CashierDashboardProps> = ({ onOpenPOS, onExitToStore }) => {
  const {
    t,
    language,
    currentBranch,
    branchProducts,
    branchOrders,
    branchSales,
    allProfiles,
    currentUser,
    switchUserRole,
    shifts,
    activeShift,
    openShift,
    closeShift,
    getShiftSummary,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    addProfile,
    deleteStaffProfile,
    categories,
    updateOrderStatus,
    assignDriver,
    reviewPrescription
  } = usePharmacy();

  const isAr = language === 'ar';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'shifts' | 'orders' | 'inventory' | 'sales' | 'staff'>('shifts');

  // Modals state
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [selectedShiftForSummary, setSelectedShiftForSummary] = useState<Shift | null>(null);

  // Shift inputs
  const [openingCash, setOpeningCash] = useState('500');
  const [openShiftNotes, setOpenShiftNotes] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [closeShiftNotes, setCloseShiftNotes] = useState('');

  // Product Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [stockChangeQty, setStockChangeQty] = useState('10');
  const [stockReason, setStockReason] = useState<StockLog['reason']>('delivery_received');
  const [stockNotes, setStockNotes] = useState('');

  // Add Product Form State
  const [prodName, setProdName] = useState('');
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState(categories[0]?.id || '');
  const [prodPrice, setProdPrice] = useState('45');
  const [prodCostPrice, setProdCostPrice] = useState('30');
  const [prodStockQty, setProdStockQty] = useState('20');
  const [prodMinStockAlert, setProdMinStockAlert] = useState('10');
  const [prodRequiresPrescription, setProdRequiresPrescription] = useState(false);
  const [prodDosage, setProdDosage] = useState('500mg');
  const [prodDescription, setProdDescription] = useState('');

  // Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+20 ');
  const [staffRole, setStaffRole] = useState<'cashier' | 'driver'>('cashier');

  // Search & Filter state
  const [searchInventory, setSearchInventory] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reprintSale, setReprintSale] = useState<Sale | null>(null);

  // Cashiers assigned to this branch
  const branchCashiers = allProfiles.filter(
    p => p.role === 'cashier' && p.branch_id === currentBranch.id
  );

  // Drivers available for dispatch
  const branchDrivers = allProfiles.filter(
    p => p.role === 'driver' && (!p.branch_id || p.branch_id === currentBranch.id)
  );

  // Shifts for this branch
  const branchShifts = shifts.filter(s => s.branch_id === currentBranch.id);

  // Calculations
  const branchDailySales = branchSales.reduce((sum, s) => sum + s.total, 0);
  const pendingOrders = branchOrders.filter(o => o.status === 'pending');
  const lowStockCount = branchProducts.filter(p => p.stock_qty <= p.min_stock_alert).length;

  const filteredProducts = branchProducts.filter(p => {
    const q = searchInventory.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || (p.name_ar && p.name_ar.includes(q)) || p.barcode.includes(q);
  });

  // Handle Switch to another cashier on the same branch
  const handleSwitchBranchCashier = (cashierId: string) => {
    switchUserRole('cashier', currentBranch.id, cashierId);
  };

  // Open shift action
  const handleConfirmOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openShift(parseFloat(openingCash) || 0, openShiftNotes);
    setShowOpenShiftModal(false);
    setOpenShiftNotes('');
  };

  // Close shift action
  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    closeShift(activeShift.id, parseFloat(closingCash) || 0, closeShiftNotes);
    setShowCloseShiftModal(false);
    setClosingCash('');
    setCloseShiftNotes('');
  };

  // Add Product Submit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodBarcode.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodName,
        name_ar: prodNameAr || undefined,
        barcode: prodBarcode,
        category_id: prodCategoryId,
        price: parseFloat(prodPrice) || 0,
        cost_price: parseFloat(prodCostPrice) || 0,
        min_stock_alert: parseInt(prodMinStockAlert, 10) || 5,
        requires_prescription: prodRequiresPrescription,
        dosage: prodDosage,
        description: prodDescription
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: prodName,
        name_ar: prodNameAr || prodName,
        barcode: prodBarcode,
        category_id: prodCategoryId,
        branch_id: currentBranch.id,
        price: parseFloat(prodPrice) || 0,
        cost_price: parseFloat(prodCostPrice) || 0,
        stock_qty: parseInt(prodStockQty, 10) || 0,
        min_stock_alert: parseInt(prodMinStockAlert, 10) || 5,
        requires_prescription: prodRequiresPrescription,
        dosage: prodDosage,
        description: prodDescription,
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
        batch_number: `BCH-${Date.now().toString().slice(-4)}`,
        expiry_date: '2027-12-31'
      });
      setShowAddProductModal(false);
    }

    // Reset Form
    setProdName('');
    setProdNameAr('');
    setProdBarcode('');
    setProdPrice('45');
    setProdCostPrice('30');
    setProdStockQty('20');
  };

  // Open Edit Product Modal
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdNameAr(p.name_ar || '');
    setProdBarcode(p.barcode);
    setProdCategoryId(p.category_id);
    setProdPrice(p.price.toString());
    setProdCostPrice((p.cost_price || p.price * 0.7).toString());
    setProdStockQty(p.stock_qty.toString());
    setProdMinStockAlert(p.min_stock_alert.toString());
    setProdRequiresPrescription(p.requires_prescription);
    setProdDosage(p.dosage || '');
    setProdDescription(p.description || '');
  };

  // Handle Stock Adjustment
  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const qty = parseInt(stockChangeQty, 10);
    if (isNaN(qty)) return;

    adjustStock(adjustingProduct.id, qty, stockReason, stockNotes || 'Branch inventory adjustment');
    setAdjustingProduct(null);
    setStockNotes('');
  };

  // Add Branch Staff
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim()) return;

    addProfile({
      full_name: staffName,
      email: staffEmail,
      phone: staffPhone,
      role: staffRole,
      branch_id: currentBranch.id,
      avatar_url: staffRole === 'cashier' 
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    });

    setShowAddStaffModal(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('+20 ');
  };

  const handleExit = () => {
    if (onExitToStore) {
      onExitToStore();
    } else {
      window.location.hash = '';
      switchUserRole('customer');
    }
  };

  const activeShiftSummary = activeShift ? getShiftSummary(activeShift.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
      {/* Top Banner: Branch Details + Cashier Switcher + Exit Button */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                <Building2 className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                {isAr ? currentBranch.name_ar : currentBranch.name}
              </h1>
              <span className="bg-teal-950 text-teal-300 border border-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {isAr ? 'بيانات خاصة بالفرع' : 'Branch Scoped'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentBranch.address} • {currentBranch.phone}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Quick POS Launch button */}
            <button
              onClick={onOpenPOS}
              id="cashier-launch-pos-btn"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-teal-700/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[44px]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isAr ? 'فتح نقطة البيع (POS)' : 'Open Fast POS'}</span>
            </button>

            {/* Exit to Public Store */}
            <button
              onClick={handleExit}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 min-h-[44px]"
              title={isAr ? 'خروج والعودة للمتجر العام' : 'Exit to Public Store'}
            >
              <LogOut className="w-4 h-4 rtl:rotate-180" />
              <span>{isAr ? 'خروج للمتجر' : 'Exit Store'}</span>
            </button>
          </div>
        </div>

        {/* Cashier Multi-Account Switcher on this Branch */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{isAr ? 'الكاشير الحالي:' : 'Current Cashier:'}</span>
            <div className="bg-slate-800 text-teal-300 font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{currentUser.full_name}</span>
            </div>
          </div>

          {/* Switch Cashier Selector for this branch */}
          {branchCashiers.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 hidden sm:inline">{isAr ? 'تبديل الكاشير المناوب:' : 'Switch Cashier:'}</span>
              <select
                value={currentUser.id}
                onChange={(e) => handleSwitchBranchCashier(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {branchCashiers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Shift Status Bar (Requirement 2) */}
      <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
        activeShift 
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
          : 'bg-amber-50/90 border-amber-300 text-amber-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            activeShift ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
          }`}>
            <Clock className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm">
                {activeShift 
                  ? (isAr ? `شيفت نشط للكاشير: ${activeShift.cashier_name}` : `Active Shift: ${activeShift.cashier_name}`) 
                  : (isAr ? 'لا يوجد شيفت مفتوح حالياً' : 'No Active Shift for Current Cashier')}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                activeShift ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {activeShift ? (isAr ? 'مفتوح' : 'Open') : (isAr ? 'مغلق' : 'Closed')}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-0.5">
              {activeShift 
                ? (isAr 
                    ? `افتتح في ${new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • العهدة النقدية الافتتاحية: ${activeShift.opening_cash_balance.toFixed(2)} EGP`
                    : `Opened at ${new Date(activeShift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Opening drawer cash: ${activeShift.opening_cash_balance.toFixed(2)} EGP`)
                : (isAr ? 'يجب بدء الشيفت وتحديد العهدة النقدية لتتمكن من إجراء مبيعات الكاونتر.' : 'Start shift session with opening drawer cash to record POS sales.')}
            </p>
          </div>
        </div>

        {/* Shift Action Buttons */}
        <div className="flex items-center gap-2">
          {activeShift ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              id="cashier-close-shift-btn"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 min-h-[44px]"
            >
              {isAr ? 'إنهاء وتقفيل الشيفت' : 'End / Close Shift'}
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              id="cashier-start-shift-btn"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 min-h-[44px]"
            >
              {isAr ? 'بدء شيفت جديد' : 'Start New Shift'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlights Cards (Mobile Stacked) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {isAr ? 'مبيعات الكاونتر اليوم' : 'Today POS Sales'}
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
            {branchDailySales.toFixed(2)} EGP
          </p>
          <span className="text-[11px] text-teal-600 font-semibold mt-0.5 block">
            {branchSales.length} {isAr ? 'إيصال مسجل' : 'receipts recorded'}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {isAr ? 'طلبات التوصيل الجديدة' : 'Pending Deliveries'}
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1 font-mono">
            {pendingOrders.length}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            {isAr ? 'بانتظار التأكيد والإسناد' : 'Awaiting confirmation'}
          </span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {isAr ? 'تنبيهات نواقص المخزون' : 'Low Stock Alerts'}
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1 font-mono">
            {lowStockCount}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
            {isAr ? 'أدوية بلغت الحد الأدنى' : 'Under minimum threshold'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation (Responsive scrollable pills) */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'shifts', label: isAr ? 'الشيفتات والجلسات' : 'Shift Management', icon: Clock, count: branchShifts.length },
          { id: 'inventory', label: isAr ? 'مخزون الفرع' : 'Branch Inventory', icon: Package, count: branchProducts.length },
          { id: 'orders', label: isAr ? 'طلبات الديليفري' : 'Delivery Orders', icon: Bike, count: pendingOrders.length },
          { id: 'sales', label: isAr ? 'فواتير الكاونتر' : 'POS Receipts', icon: FileText, count: branchSales.length },
          { id: 'staff', label: isAr ? 'فريق عمل الفرع' : 'Branch Staff', icon: Users, count: branchCashiers.length + branchDrivers.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SHIFTS MANAGEMENT */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          {/* Active Shift Card Details if exists */}
          {activeShift && activeShiftSummary && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isAr ? 'ملخص الشيفت النشط الحالي' : 'Current Active Shift Summary'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAr ? `بدأ بواسطة: ${activeShift.cashier_name} في ${new Date(activeShift.opened_at).toLocaleString()}` : `Opened by ${activeShift.cashier_name} at ${new Date(activeShift.opened_at).toLocaleString()}`}
                  </p>
                </div>
                <button
                  onClick={() => setShowCloseShiftModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer self-start sm:self-auto min-h-[40px]"
                >
                  {isAr ? 'تقفيل الشيفت وحساب الدرج' : 'Close Shift & Reconcile'}
                </button>
              </div>

              {/* Shift stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">{isAr ? 'العهدة الافتتاحية:' : 'Opening Drawer Cash:'}</span>
                  <span className="text-sm font-black font-mono text-slate-900">{activeShift.opening_cash_balance.toFixed(2)} EGP</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block">{isAr ? 'مبيعات كاش محصلة:' : 'Cash Collected:'}</span>
                  <span className="text-sm font-black font-mono text-emerald-800">+{activeShiftSummary.cashSales.toFixed(2)} EGP</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <span className="text-blue-700 block">{isAr ? 'مبيعات فيزا / بطاقة:' : 'Card Sales:'}</span>
                  <span className="text-sm font-black font-mono text-blue-800">{activeShiftSummary.cardSales.toFixed(2)} EGP</span>
                </div>
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
                  <span className="text-teal-800 font-bold block">{isAr ? 'النقدية المتوقعة بالدرج:' : 'Expected Cash in Drawer:'}</span>
                  <span className="text-base font-black font-mono text-teal-900">{activeShiftSummary.expectedCash.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>
          )}

          {/* Shift History for this Branch */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isAr ? 'سجل شيفتات فرع ' + currentBranch.name : `Shift History (${currentBranch.name})`}
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {branchShifts.length} {isAr ? 'شيفت مسجل' : 'sessions'}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {branchShifts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {isAr ? 'لا يوجد سجل شيفتات لهذا الفرع حتى الآن' : 'No shifts recorded yet for this branch'}
                </div>
              ) : (
                branchShifts.map((s) => {
                  const sSummary = getShiftSummary(s.id);
                  const isCurOpen = s.status === 'open';
                  return (
                    <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isCurOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span className="font-bold text-xs text-slate-900">{s.cashier_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isCurOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {isAr ? 'بدء:' : 'Opened:'} {new Date(s.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          {s.closed_at && ` • ${isAr ? 'انتهاء:' : 'Closed:'} ${new Date(s.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                        {s.notes && (
                          <p className="text-[11px] text-slate-400 italic">"{s.notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isAr ? 'عهدة بداية' : 'Opening'}</span>
                          <span className="font-bold text-slate-800">{s.opening_cash_balance.toFixed(2)}</span>
                        </div>
                        {s.closing_cash_balance !== null && (
                          <div>
                            <span className="text-slate-400 text-[10px] block">{isAr ? 'نقدية إغلاق' : 'Closing'}</span>
                            <span className="font-bold text-slate-800">{s.closing_cash_balance.toFixed(2)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isAr ? 'إجمالي المبيعات' : 'Sales'}</span>
                          <span className="font-black text-teal-700">{sSummary.totalSales.toFixed(2)} EGP</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT (Requirement 3: Full Product CRUD & Stock Adjustment) */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Inventory Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-0 ps-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchInventory}
                onChange={(e) => setSearchInventory(e.target.value)}
                placeholder={isAr ? 'ابحث بالاسم أو الباركود...' : 'Search medications by name or barcode...'}
                className="w-full ps-9 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setProdName('');
                setProdNameAr('');
                setProdBarcode('');
                setProdPrice('45');
                setProdCostPrice('30');
                setProdStockQty('20');
                setShowAddProductModal(true);
              }}
              id="cashier-add-product-btn"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة صنف جديد للفرع' : 'Add Branch Product'}</span>
            </button>
          </div>

          {/* Product Cards (Mobile-first responsive cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 text-xs">
                {isAr ? 'لا توجد أدوية مطابقة للبحث في مخزون هذا الفرع' : 'No products found in this branch inventory'}
              </div>
            ) : (
              filteredProducts.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {isAr && p.name_ar ? p.name_ar : p.name}
                        </h4>
                        {p.requires_prescription && (
                          <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {p.barcode} {p.dosage ? `• ${p.dosage}` : ''}
                      </p>
                      <p className="text-xs font-black text-teal-700 font-mono mt-1">
                        {p.price.toFixed(2)} EGP
                      </p>
                    </div>
                  </div>

                  {/* Stock and Status */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">{isAr ? 'الرصيد:' : 'Stock:'}</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        p.stock_qty <= p.min_stock_alert
                          ? 'bg-rose-100 text-rose-800 font-black'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stock_qty}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Adjust Stock button */}
                      <button
                        onClick={() => {
                          setAdjustingProduct(p);
                          setStockChangeQty('10');
                          setStockReason('delivery_received');
                          setStockNotes('');
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        title={isAr ? 'تعديل الرصيد' : 'Adjust Stock'}
                      >
                        {isAr ? 'تعديل رصيد' : 'Adjust'}
                      </button>

                      {/* Edit Product button */}
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title={isAr ? 'تعديل الصنف' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Product button */}
                      <button
                        onClick={() => {
                          if (confirm(isAr ? `هل أنت متأكد من حذف ${p.name}؟` : `Delete product ${p.name}?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={isAr ? 'حذف الصنف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {branchOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              {isAr ? 'لا توجد طلبات توصيل مسجلة لهذا الفرع' : 'No online delivery orders for this branch'}
            </div>
          ) : (
            branchOrders.map((order) => {
              const hasRx = order.items.some(i => i.requires_prescription);
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-teal-700">{order.order_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'out_for_delivery'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.status}
                      </span>
                      {hasRx && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 rounded">
                          Prescription Rx
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{order.customer_name} ({order.customer_phone})</p>
                      <p className="text-slate-500 text-[11px]">{order.delivery_address}, {order.city}</p>
                    </div>
                    <div className="sm:text-end font-mono">
                      <p className="text-sm font-black text-slate-900">{order.total.toFixed(2)} EGP</p>
                      <p className="text-[11px] text-slate-500">{order.items.length} {isAr ? 'أصناف (كاش)' : 'items (COD)'}</p>
                    </div>
                  </div>

                  {/* Order items pill preview */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {order.items.map((it, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                        {it.product_name} × {it.quantity}
                      </span>
                    ))}
                  </div>

                  {/* Action row: Assign driver & Update status */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">{isAr ? 'المندوب:' : 'Driver:'}</span>
                      <select
                        value={order.driver_id || ''}
                        onChange={(e) => assignDriver(order.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1 font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="">{isAr ? '-- تعيين مندوب --' : '-- Assign Driver --'}</option>
                        {branchDrivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'بدء التجهيز' : 'Prepare Order'}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'خروج للتوصيل' : 'Dispatch'}
                        </button>
                      )}
                      {order.status === 'out_for_delivery' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {isAr ? 'تم التسليم' : 'Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: POS SALES RECEIPTS */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-700">
              {isAr ? 'فواتير الكاونتر للفرع' : 'Branch Counter Receipts'}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{branchSales.length} {isAr ? 'فاتورة' : 'sales'}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {branchSales.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد فواتير كاونتر مسجلة حتى الآن' : 'No in-store receipts yet'}
              </div>
            ) : (
              branchSales.map(sale => (
                <div key={sale.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{sale.receipt_no}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        sale.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.payment_method}
                      </span>
                      {sale.shift_id && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Shift: {sale.shift_id.slice(-6)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sale.customer_name} • {sale.cashier_name} • {new Date(sale.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-teal-700 font-mono">
                      {sale.total.toFixed(2)} EGP
                    </span>
                    <button
                      onClick={() => setReprintSale(sale)}
                      className="p-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-xl transition-colors cursor-pointer"
                      title={isAr ? 'إعادة طباعة الإيصال' : 'Reprint Receipt'}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STAFF MANAGEMENT (Requirement 3: Add Cashier & Driver scoped to this branch) */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'فريق العمل في هذا الفرع' : 'Branch Staff Team'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'يمكن للكاشير إضافة وإدارة كاشيرات وسائقين لهذا الفرع فقط.' : 'Create and manage cashiers and delivery drivers scoped strictly to your branch.'}
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              id="cashier-add-staff-btn"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAr ? 'إضافة موظف جديد للفرع' : 'Add Branch Staff'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...branchCashiers, ...branchDrivers].map((staff) => (
              <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={staff.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={staff.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{staff.full_name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        staff.role === 'cashier' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {staff.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{staff.email}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{staff.phone}</p>
                  </div>
                </div>

                {/* Remove button (Cannot remove self) */}
                {staff.id !== currentUser.id && (
                  <button
                    onClick={() => {
                      if (confirm(isAr ? `هل أنت متأكد من إزالة ${staff.full_name}؟` : `Remove ${staff.full_name} from staff?`)) {
                        deleteStaffProfile(staff.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'حذف الموظف' : 'Remove Staff'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: OPEN SHIFT */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'بدء شيفت كاشير جديد' : 'Start Cashier Shift'}
                </h3>
              </div>
              <button onClick={() => setShowOpenShiftModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'العهدة النقدية في الدرج (EGP):' : 'Opening Drawer Cash (EGP):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {isAr ? 'ملاحظات الافتتاح:' : 'Opening Notes:'}
                </label>
                <input
                  type="text"
                  value={openShiftNotes}
                  onChange={(e) => setOpenShiftNotes(e.target.value)}
                  placeholder={isAr ? 'مثال: بداية الشيفت الصباحي' : 'e.g. Morning Shift Start'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد وبدء الشيفت' : 'Open Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLOSE SHIFT (With Reconcile Summary) */}
      {showCloseShiftModal && activeShift && activeShiftSummary && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? 'تقفيل ومراجعة الشيفت' : 'Close Shift Reconciliation'}
                </h3>
              </div>
              <button onClick={() => setShowCloseShiftModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reconciliation Audit Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'عهدة بداية الشيفت:' : 'Opening Cash:'}</span>
                <span className="font-bold font-mono">{activeShift.opening_cash_balance.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>{isAr ? 'مبيعات كاش محصلة (+):' : 'Cash Sales (+):'}</span>
                <span className="font-bold font-mono">+{activeShiftSummary.cashSales.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>{isAr ? 'مبيعات فيزا (لا تؤثر على نقدية الدرج):' : 'Card Sales (Non-cash):'}</span>
                <span className="font-bold font-mono">{activeShiftSummary.cardSales.toFixed(2)} EGP</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                <span>{isAr ? 'النقدية المتوقعة في الدرج:' : 'Expected Cash in Drawer:'}</span>
                <span className="text-teal-700 font-mono">{activeShiftSummary.expectedCash.toFixed(2)} EGP</span>
              </div>
            </div>

            <form onSubmit={handleConfirmCloseShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'النقدية الفعلية المحصية بالدرج (Closing Cash):' : 'Counted Actual Closing Cash (EGP):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder={activeShiftSummary.expectedCash.toString()}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-black font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />

                {/* Variance indicator */}
                {closingCash && (
                  <div className="mt-2 text-xs font-bold">
                    {(() => {
                      const counted = parseFloat(closingCash) || 0;
                      const diff = counted - activeShiftSummary.expectedCash;
                      if (Math.abs(diff) < 0.01) {
                        return <span className="text-emerald-700">{isAr ? '✓ متطابق تماماً بدون عجز أو زيادة' : '✓ Perfectly balanced!'}</span>;
                      } else if (diff > 0) {
                        return <span className="text-blue-700">{isAr ? `+ زيادة في الدرج: ${diff.toFixed(2)} EGP` : `+ Over by ${diff.toFixed(2)} EGP`}</span>;
                      } else {
                        return <span className="text-rose-700">{isAr ? `- عجز في الدرج: ${Math.abs(diff).toFixed(2)} EGP` : `- Short by ${Math.abs(diff).toFixed(2)} EGP`}</span>;
                      }
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {isAr ? 'ملاحظات الإغلاق:' : 'Closing Notes / Discrepancy Reason:'}
                </label>
                <textarea
                  rows={2}
                  value={closeShiftNotes}
                  onChange={(e) => setCloseShiftNotes(e.target.value)}
                  placeholder={isAr ? 'أدخل أي ملاحظات حول فرق النقدية...' : 'Any comments regarding cash variance...'}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد الإغلاق وترحيل الدرج' : 'Close Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {(showAddProductModal || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingProduct 
                  ? (isAr ? 'تعديل بيانات الصنف' : 'Edit Branch Product')
                  : (isAr ? 'إضافة دواء جديد لمخزون الفرع' : 'Add New Branch Product')}
              </h3>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم الصنف (إنجليزي)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Panadol Extra 500mg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الاسم بالعربية' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={prodNameAr}
                    onChange={(e) => setProdNameAr(e.target.value)}
                    placeholder="بنادول إكسترا"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الباركود الدولي' : 'Barcode'}
                  </label>
                  <input
                    type="text"
                    required
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    placeholder="622123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر البيع (EGP)' : 'Sale Price'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'سعر التكلفة (EGP)' : 'Cost Price'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الرصيد الابتدائي' : 'Initial Stock'}
                  </label>
                  <input
                    type="number"
                    value={prodStockQty}
                    onChange={(e) => setProdStockQty(e.target.value)}
                    disabled={!!editingProduct}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'حد تنبيه النواقص' : 'Low Stock Alert'}
                  </label>
                  <input
                    type="number"
                    value={prodMinStockAlert}
                    onChange={(e) => setProdMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'التركيز / الجرعة' : 'Dosage'}
                  </label>
                  <input
                    type="text"
                    value={prodDosage}
                    onChange={(e) => setProdDosage(e.target.value)}
                    placeholder="e.g. 500mg, 10ml"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prod-rx-toggle"
                  checked={prodRequiresPrescription}
                  onChange={(e) => setProdRequiresPrescription(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="prod-rx-toggle" className="font-bold text-slate-800 cursor-pointer">
                  {isAr ? 'يتطلب روشتة طبية معتمدة (Rx Only)' : 'Requires Doctor Prescription (Rx)'}
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ الصنف' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADJUST STOCK */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {isAr ? 'تعديل رصيد المخزون' : 'Stock Adjustment'}
              </h3>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{adjustingProduct.name}</p>
              <p className="text-slate-500">{isAr ? 'الرصيد الحالي:' : 'Current Stock:'} <span className="font-mono font-black text-teal-700">{adjustingProduct.stock_qty}</span></p>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'مقدار التعديل (+ للإضافة، - للخصم)' : 'Quantity Change (+ or -):'}
                </label>
                <input
                  type="number"
                  value={stockChangeQty}
                  onChange={(e) => setStockChangeQty(e.target.value)}
                  required
                  placeholder="+10 or -5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-base font-black focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'سبب التعديل:' : 'Adjustment Reason:'}
                </label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="delivery_received">{isAr ? 'توريد واستلام شحنة جديدة' : 'Delivery Received'}</option>
                  <option value="damaged">{isAr ? 'تالف / مكسور' : 'Damaged Goods'}</option>
                  <option value="expired">{isAr ? 'منتهي الصلاحية' : 'Expired Stock'}</option>
                  <option value="audit_correction">{isAr ? 'تصحيح جرد دوري' : 'Periodic Audit Correction'}</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  {isAr ? 'ملاحظات:' : 'Notes:'}
                </label>
                <input
                  type="text"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder={isAr ? 'رقم الفاتورة أو التقرير...' : 'Invoice ref or notes...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد التعديل' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRANCH STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                {isAr ? 'إضافة موظف جديد لفرع ' + currentBranch.name : `Add Staff to ${currentBranch.name}`}
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'الاسم الكامل:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Pharm. Sameh Youssef"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'الدور الوظيفي بالفرع:' : 'Branch Role:'}
                </label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="cashier">{isAr ? 'كاشير / صيدلي نقطة البيع' : 'Cashier / Pharmacist'}</option>
                  <option value="driver">{isAr ? 'مندوب توصيل ديليفري' : 'Delivery Driver'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
                </label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@pharmachain.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'رقم الهاتف:' : 'Phone Number:'}
                </label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+20 1..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الموظف' : 'Add Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPRINT RECEIPT */}
      {reprintSale && (
        <ThermalReceipt
          sale={reprintSale}
          branch={currentBranch}
          language={language}
          onClose={() => setReprintSale(null)}
        />
      )}
    </div>
  );
};
