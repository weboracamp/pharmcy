import React, { useState, useEffect, useRef } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Sale } from '../../types';
import { ThermalReceipt } from './ThermalReceipt';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  AlertTriangle,
  Receipt,
  Keyboard,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Package,
  X,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface PosCartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

interface FastPOSProps {
  onClose?: () => void;
}

export const FastPOS: React.FC<FastPOSProps> = ({ onClose }) => {
  const {
    t,
    language,
    currentBranch,
    branchProducts,
    processPosSale,
    currentUser,
    activeShift,
    openShift
  } = usePharmacy();

  const isAr = language === 'ar';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValInput, setDiscountValInput] = useState<string>('0');
  
  // Mobile cart sheet toggle
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Shift prompt modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('500');
  const [shiftNotesInput, setShiftNotesInput] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // Completed Sale & Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Focus search on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter products for the current branch
  const filteredProducts = branchProducts.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.name_ar && p.name_ar.includes(q)) ||
      p.barcode.includes(q) ||
      (p.dosage && p.dosage.toLowerCase().includes(q))
    );
  });

  // Top high-frequency OTC items for quick shelf
  const quickShelfItems = branchProducts.slice(0, 6);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const effectiveDiscount = discountType === 'percent'
    ? (subtotal * (discountAmount / 100))
    : Math.min(discountAmount, subtotal);
  const finalTotal = Math.max(0, subtotal - effectiveDiscount);

  const tenderedNum = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, tenderedNum - finalTotal);

  // Add product to POS cart
  const addToPosCart = (product: Product) => {
    if (product.stock_qty <= 0) {
      alert(isAr ? 'عفواً، هذا الصنف نفد من المخزون!' : 'Product is out of stock in this branch!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          alert(isAr ? 'الكمية المطلوبة تتجاوز المخزون المتوفر!' : 'Quantity exceeds current branch stock!');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, unit_price: product.price }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const product = branchProducts.find(p => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > product.stock_qty) {
      alert(isAr ? 'الكمية تتجاوز رصيد الفرع!' : 'Quantity exceeds branch stock!');
      return;
    }

    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQty }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearPosCart = () => {
    if (cart.length > 0 && confirm(isAr ? 'هل تريد مسح السلة الحالية؟' : 'Clear current transaction?')) {
      setCart([]);
      setDiscountAmount(0);
      setDiscountValInput('0');
      setSearchQuery('');
      searchInputRef.current?.focus();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        triggerCheckout();
      } else if (e.key === 'Escape') {
        if (showPaymentModal) {
          setShowPaymentModal(false);
        } else if (showShiftModal) {
          setShowShiftModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, finalTotal, showPaymentModal, activeShift]);

  // Handle Search Input KeyPress (e.g. Enter to pick top result or barcode)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactBarcode = branchProducts.find(p => p.barcode === searchQuery.trim());
      if (exactBarcode) {
        addToPosCart(exactBarcode);
        setSearchQuery('');
        return;
      }
      if (filteredProducts.length > 0) {
        addToPosCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Trigger checkout flow (with shift verification)
  const triggerCheckout = () => {
    if (cart.length === 0) return;
    
    // Check shift requirement
    if (!activeShift) {
      setShowShiftModal(true);
      return;
    }

    setTenderedAmount(finalTotal.toString());
    setShowPaymentModal(true);
  };

  // Quick Open Shift handler
  const handleQuickOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(openingCashInput) || 0;
    openShift(cash, shiftNotesInput || 'Started via Fast POS counter');
    setShowShiftModal(false);
    // Proceed to payment modal
    setTenderedAmount(finalTotal.toString());
    setShowPaymentModal(true);
  };

  // Finalize POS Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    if (!activeShift) {
      setShowShiftModal(true);
      return;
    }

    if (paymentMethod === 'cash' && tenderedNum < finalTotal) {
      alert(isAr ? 'المبلغ المستلم أقل من الإجمالي المطلوب!' : 'Tendered amount is less than total!');
      return;
    }

    const sale = processPosSale({
      items: cart,
      subtotal,
      discount: effectiveDiscount,
      total: finalTotal,
      payment_method: paymentMethod,
      tendered_amount: paymentMethod === 'cash' ? tenderedNum : undefined,
      change_amount: paymentMethod === 'cash' ? changeDue : undefined,
      customer_name: customerName,
      customer_phone: customerPhone
    });

    setCompletedSale(sale);
    setShowPaymentModal(false);
    setShowMobileCart(false);
    setCart([]);
    setDiscountAmount(0);
    setDiscountValInput('0');
    setCustomerName('');
    setCustomerPhone('');
    setTenderedAmount('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-24 lg:pb-6">
      {/* POS Top Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={isAr ? 'إغلاق نقطة البيع' : 'Back to Dashboard'}
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
          )}

          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
            <Barcode className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-tight truncate">
                {isAr ? 'نقطة البيع السريعة' : 'Fast POS Counter'}
              </h1>
              <span className="bg-teal-500/20 text-teal-300 text-[11px] px-2 py-0.5 rounded-full font-bold border border-teal-500/30 truncate">
                {isAr ? currentBranch.name_ar : currentBranch.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {currentUser.full_name}
            </p>
          </div>
        </div>

        {/* Shift Badge Indicator */}
        <div className="flex items-center gap-2">
          {activeShift ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/40 text-emerald-400 text-xs px-2.5 py-1.5 rounded-xl font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">{isAr ? 'الشيفت نشط:' : 'Shift Open:'}</span>
              <span className="font-mono">{activeShift.opening_cash_balance} EGP</span>
            </div>
          ) : (
            <button
              onClick={() => setShowShiftModal(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-black transition-all cursor-pointer animate-bounce"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'بدء الشيفت' : 'Start Shift'}</span>
            </button>
          )}

          {/* Keyboard Shortcuts Hint on Desktop */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">F2: Search</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">F9: Pay</span>
          </div>
        </div>
      </div>

      {/* No Shift Warning Banner */}
      {!activeShift && (
        <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-black">
                {isAr ? 'تنبيه: لا يوجد شيفت مفتوح حالياً لهذا الكاشير' : 'Active Shift Required'}
              </p>
              <p className="text-amber-800 text-[11px]">
                {isAr ? 'وفقاً لسياسة الصيدلية، يجب فتح شيفت برصيد نقدية لبدء تسجيل المبيعات.' : 'A cashier shift session must be opened with opening cash to audit sales.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowShiftModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            {isAr ? 'فتح شيفت جديد' : 'Open Shift Now'}
          </button>
        </div>
      )}

      {/* Main Responsive Layout: Product catalog on left/top, Cart on right/bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Product Search, Barcode Input, Quick Shelf */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barcode & Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-teal-600" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              id="pos-barcode-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={isAr ? 'امسح الباركود أو ابحث عن الدواء (F2)...' : 'Scan barcode or search medication (F2)...'}
              className="w-full ps-11 pe-24 py-3.5 bg-white border-2 border-slate-200 focus:border-teal-600 rounded-2xl shadow-xs text-sm font-semibold focus:ring-4 focus:ring-teal-500/10 focus:outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Instant Search Results Panel */}
          {searchQuery.trim().length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {isAr ? 'لا توجد أدوية مطابقة في رصيد هذا الفرع' : 'No medications found in this branch inventory'}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => {
                      addToPosCart(product);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-teal-50/70 flex items-center justify-between gap-3 cursor-pointer transition-colors active:bg-teal-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {isAr && product.name_ar ? product.name_ar : product.name}
                          </p>
                          {product.requires_prescription && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Rx
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Barcode: {product.barcode} | Exp: {product.expiry_date}
                        </p>
                      </div>
                    </div>

                    <div className="text-end shrink-0">
                      <p className="text-sm font-black text-teal-700">
                        {product.price.toFixed(2)} EGP
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.stock_qty <= product.min_stock_alert
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isAr ? `رصيد: ${product.stock_qty}` : `Stock: ${product.stock_qty}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quick OTC Shelf Cards */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                {isAr ? 'الرف السريع الأكثر طلباً (OTC)' : 'Express OTC Quick Shelf'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'اضغط للإضافة الفورية' : '1-tap add'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quickShelfItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToPosCart(item)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-start flex flex-col justify-between transition-all group cursor-pointer active:scale-98 min-h-[90px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {item.barcode.slice(-4)}
                      </span>
                      {item.requires_prescription && (
                        <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded">
                          Rx
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 line-clamp-2 leading-snug">
                      {isAr && item.name_ar ? item.name_ar : item.name}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="font-black text-teal-600">
                      {item.price.toFixed(2)} EGP
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Qty: {item.stock_qty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: POS Cart on Desktop, and also reusable in Mobile Drawer */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex-1 flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {isAr ? 'عربة البيع' : 'Active Cart'}
                </span>
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearPosCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-[320px] divide-y divide-slate-100 p-2">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">
                    {isAr ? 'السلة فارغة. اختر دواءً للبدء.' : 'Cart is empty. Scan barcode or tap medication.'}
                  </p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {isAr && item.product.name_ar ? item.product.name_ar : item.product.name}
                        </p>
                        {item.product.requires_prescription && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.unit_price.toFixed(2)} EGP
                      </p>
                    </div>

                    {/* Quantity Spinner with min 44px touch target */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-700 hover:bg-slate-200 cursor-pointer text-xs font-bold active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-black text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-700 hover:bg-slate-200 cursor-pointer text-xs font-bold active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-end shrink-0 w-18">
                      <p className="text-xs font-black text-teal-700">
                        {(item.quantity * item.unit_price).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer text-[10px]"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Billing Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                <span className="font-mono font-bold text-slate-800">{subtotal.toFixed(2)} EGP</span>
              </div>

              {/* Total Due */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-900">{isAr ? 'الإجمالي النهائي:' : 'Net Total:'}</span>
                <span className="text-xl font-black text-teal-700 font-mono">
                  {finalTotal.toFixed(2)} EGP
                </span>
              </div>

              {/* Pay Button */}
              <button
                onClick={triggerCheckout}
                disabled={cart.length === 0}
                id="pos-proceed-payment-btn"
                className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <Receipt className="w-4 h-4" />
                <span>{isAr ? 'الدفع وإصدار الفاتورة (F9)' : 'Pay & Issue Receipt (F9)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Sticky Bottom Action Bar (< lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-teal-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">{isAr ? 'الإجمالي:' : 'Total:'}</p>
            <p className="text-sm font-black text-teal-700 font-mono">
              {finalTotal.toFixed(2)} EGP
            </p>
          </div>
        </div>

        <button
          onClick={triggerCheckout}
          disabled={cart.length === 0}
          className="min-h-[48px] px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Receipt className="w-4 h-4" />
          <span>{isAr ? 'سداد الفاتورة' : 'Checkout & Pay'}</span>
        </button>
      </div>

      {/* Shift Starter Modal (Prompted if no active shift) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'فتح شيفت جديد للكاشير' : 'Start Cashier Shift'}
                </h3>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {isAr
                ? `الكاشير المناوب: ${currentUser.full_name} في فرع ${currentBranch.name}. أدخل العهدة النقدية الافتتاحية في الدرج.`
                : `Opening cashier shift for ${currentUser.full_name} at ${currentBranch.name}. Enter opening drawer cash balance.`}
            </p>

            <form onSubmit={handleQuickOpenShift} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'رصيد النقدية الافتتاحي (EGP):' : 'Opening Cash Balance (EGP):'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-base font-mono font-black focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {isAr ? 'ملاحظات (اختياري):' : 'Notes (optional):'}
                </label>
                <input
                  type="text"
                  value={shiftNotesInput}
                  onChange={(e) => setShiftNotesInput(e.target.value)}
                  placeholder={isAr ? 'مثال: عهدة الصباح' : 'e.g. Morning drawer cash'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد وبدء الشيفت' : 'Open Shift & Continue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? 'سداد الفاتورة وطباعة الإيصال' : 'Checkout & Settlement'}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'نقدي (كاش)' : 'Cash'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'فيزا / بطاقة' : 'Card'}</span>
              </button>
            </div>

            {/* Total Due display */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">{isAr ? 'المطلوب سداده:' : 'Amount Due:'}</span>
              <span className="text-xl font-black text-teal-700 font-mono">
                {finalTotal.toFixed(2)} EGP
              </span>
            </div>

            {/* If Cash, show quick tender amounts and change calculator */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'المبلغ المستلم من العميل (Tendered):' : 'Amount Received from Customer:'}
                  </label>
                  <input
                    type="number"
                    id="pos-tendered-amount-input"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Fast denomination chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: isAr ? 'المبلغ بالضبط' : 'Exact', value: finalTotal },
                    { label: '+50', value: Math.ceil(finalTotal / 50) * 50 },
                    { label: '+100', value: Math.ceil(finalTotal / 100) * 100 },
                    { label: '+200', value: Math.ceil(finalTotal / 200) * 200 }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTenderedAmount(chip.value.toString())}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-100 text-slate-800 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Change output */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800">{isAr ? 'الباقي للعميل:' : 'Change Due:'}</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {changeDue.toFixed(2)} EGP
                  </span>
                </div>
              </div>
            )}

            {/* Optional customer name / phone */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  {isAr ? 'اسم العميل (اختياري)' : 'Customer Name'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  {isAr ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+20..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-1/3 py-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                id="confirm-pos-sale-btn"
                onClick={handleCompleteSale}
                className="w-2/3 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-700/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{isAr ? 'تأكيد البيع وطباعة الإيصال' : 'Confirm & Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render thermal receipt when sale is completed */}
      {completedSale && (
        <ThermalReceipt
          sale={completedSale}
          branch={currentBranch}
          language={language}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
