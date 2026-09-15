import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Product, Category } from '../../types';
import { OrderTracker } from './OrderTracker';
import {
  Search,
  Filter,
  ShoppingBag,
  Upload,
  FileCheck,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  HeartPulse,
  Pill,
  Sparkles,
  Info,
  X,
  Truck,
  Phone,
  FileText,
  Camera,
  Check
} from 'lucide-react';

export const OnlineStore: React.FC = () => {
  const {
    t,
    language,
    products,
    branches,
    currentBranch,
    setCurrentBranch,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartSubtotal,
    hasRestrictedItems,
    placeOnlineOrder
  } = usePharmacy();

  const isAr = language === 'ar';

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionFilter, setPrescriptionFilter] = useState<'all' | 'otc' | 'rx'>('all');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState('Cairo');
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentBranchId, setFulfillmentBranchId] = useState<string>(currentBranch.id);

  // Prescription Upload State (Mandatory if restricted items in cart)
  const [uploadedRxFile, setUploadedRxFile] = useState<{ name: string; url: string } | null>(null);
  const [rxError, setRxError] = useState<string>('');

  // Filter products scoped to fulfillment branch
  const storeProducts = products.filter(p => p.branch_id === fulfillmentBranchId);

  const filteredProducts = storeProducts.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesRx = prescriptionFilter === 'all'
      ? true
      : prescriptionFilter === 'rx'
        ? p.requires_prescription
        : !p.requires_prescription;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.name_ar && p.name_ar.includes(q)) ||
      p.barcode.includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));

    return matchesCat && matchesRx && matchesSearch;
  });

  // Handle Prescription File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a production Supabase app with bucket 'prescriptions':
    // supabase.storage.from('prescriptions').upload(`rx_${Date.now()}_${file.name}`, file)
    // For seamless client preview, create an object URL
    const fileUrl = URL.createObjectURL(file);
    setUploadedRxFile({
      name: file.name,
      url: fileUrl
    });
    setRxError('');
  };

  // Preset sample prescriptions for quick testing
  const selectSamplePrescription = () => {
    setUploadedRxFile({
      name: 'Sample_Dr_Kareem_Cardiology_Rx.jpg',
      url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80'
    });
    setRxError('');
  };

  // Submit Order
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert(isAr ? 'يرجى إكمال الاسم، الهاتف، وعنوان التوصيل' : 'Please provide your name, phone number, and address');
      return;
    }

    if (hasRestrictedItems && !uploadedRxFile) {
      setRxError(isAr ? 'يجب رفع صورة الروشتة للمتابعة' : 'Prescription upload is required for restricted medications');
      return;
    }

    const newOrder = placeOnlineOrder({
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      city,
      notes: orderNotes,
      branch_id: fulfillmentBranchId,
      prescriptionFile: uploadedRxFile
    });

    setConfirmedOrderNumber(newOrder.order_number);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
  };

  const deliveryFee = 15.00;
  const grandTotal = cartSubtotal + (cart.length > 0 ? deliveryFee : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Top Banner: Pharmacy Quality Guarantee & Delivery notice */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold text-teal-300">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'صيدلية مرخصة معتمدة وتوصيل سريع' : 'Licensed Pharmacy Chain & Express Home Delivery'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {isAr
              ? 'الأدوية الأصلية ورعاية أسرتك تصل إلى باب منزلك'
              : 'Authentic Medications & Trusted Healthcare Delivered Fast'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            {isAr
              ? 'تصفح أدوية الفروع الحية، ارفع روشتتك للأدوية المقيدة، واستلم طلبك ودفع عند الاستلام مع مناديب صيدليات فارماتشين.'
              : 'Shop from live branch inventories, upload prescriptions for regulated items, and enjoy safe Cash on Delivery via our dedicated couriers.'}
          </p>

          {/* Fulfillment branch indicator & track order action */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl text-xs border border-slate-700">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>{isAr ? 'الفرع المورد للطلب:' : 'Fulfilling Branch:'}</span>
              <select
                value={fulfillmentBranchId}
                onChange={(e) => {
                  setFulfillmentBranchId(e.target.value);
                  const b = branches.find(item => item.id === e.target.value);
                  if (b) setCurrentBranch(b);
                }}
                className="bg-slate-700 text-white font-bold rounded px-2 py-1 outline-none text-xs"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {isAr ? b.name_ar : b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsTrackerOpen(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>{isAr ? 'تتبع طلبك الحالي' : 'Track Existing Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="store-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن اسم الدواء، المادة الفعالة، أو الاستخدام...' : 'Search medications, active ingredients, dosage...'}
              className="w-full ps-11 pe-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-xs"
            />
          </div>

          {/* Rx vs OTC Segment Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setPrescriptionFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                prescriptionFilter === 'all' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isAr ? 'الكل' : 'All Products'}
            </button>
            <button
              onClick={() => setPrescriptionFilter('otc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                prescriptionFilter === 'otc' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isAr ? 'بدون وصفة (OTC)' : 'OTC Only'}
            </button>
            <button
              onClick={() => setPrescriptionFilter('rx')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                prescriptionFilter === 'rx' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isAr ? 'يحتاج روشتة (Rx)' : 'Rx Required'}
            </button>
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isAr ? 'جميع الأقسام' : 'All Categories'}
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isAr ? cat.name_ar : cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            {isAr ? `عرض ${filteredProducts.length} دواء متوفر في الفرع` : `Showing ${filteredProducts.length} items in branch inventory`}
          </span>
          <span className="font-medium text-teal-700">
            {branches.find(b => b.id === fulfillmentBranchId)?.name}
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Pill className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-800">
              {isAr ? 'لم يتم العثور على أدوية مطابقة لبحثك' : 'No medications matched your filters in this branch'}
            </p>
            <p className="text-xs text-slate-500">
              {isAr ? 'جرب البحث بكلمة أخرى أو التبديل لفرع آخر من الفروع التابعة' : 'Try searching another keyword or switch fulfilling branch'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const inStock = product.stock_qty > 0;
              const cartItem = cart.find(i => i.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5">
                        {product.requires_prescription ? (
                          <span className="bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                            <FileText className="w-3 h-3" />
                            {isAr ? 'روشتة مطلوبة' : 'Rx Required'}
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                            {isAr ? 'بدون وصفة' : 'OTC'}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-2.5 end-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs ${
                          inStock
                            ? 'bg-slate-900/80 text-white'
                            : 'bg-rose-900/90 text-white'
                        }`}>
                          {inStock ? (isAr ? `${product.stock_qty} متوفر` : `${product.stock_qty} in stock`) : (isAr ? 'نفد' : 'Out of stock')}
                        </span>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {product.supplier}
                      </p>
                      <h3
                        onClick={() => setSelectedProduct(product)}
                        className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-teal-700 cursor-pointer transition-colors leading-snug"
                      >
                        {isAr && product.name_ar ? product.name_ar : product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {isAr && product.description_ar ? product.description_ar : product.description}
                      </p>
                      {product.dosage && (
                        <p className="text-[11px] text-teal-800 font-medium bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                          {product.dosage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price & Add to Cart footer */}
                  <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {product.price.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ms-1">
                        EGP
                      </span>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateCartQty(product.id, cartItem.quantity - 1)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateCartQty(product.id, cartItem.quantity + 1)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200 text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!inStock}
                        onClick={() => addToCart(product)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          inStock
                            ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-700/20 active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{t('addToCart')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar if cart has items */}
      {cart.length > 0 && !isCartOpen && !isCheckoutOpen && (
        <div className="fixed bottom-5 start-1/2 -translate-x-1/2 z-30 max-w-lg w-[90%]">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center font-black text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="text-start">
                <p className="text-xs font-bold text-slate-200">{t('cart')}</p>
                {hasRestrictedItems && (
                  <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {isAr ? 'يتطلب رفع روشتة' : 'Requires Rx upload'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-teal-400 font-mono">
                {cartSubtotal.toFixed(2)} EGP
              </span>
              <span className="bg-teal-600 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                {isAr ? 'عرض السلة والتأكيد' : 'View Cart & Checkout'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Product Clinical Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="relative h-56 bg-slate-100">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 end-3 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 start-3">
                {selectedProduct.requires_prescription ? (
                  <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                    {isAr ? 'وصفة طبية معتمدة مطلوبة' : 'Medical Prescription Required'}
                  </span>
                ) : (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    {isAr ? 'عقار غير مقيد (OTC)' : 'Over The Counter (OTC)'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">{selectedProduct.supplier}</p>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {isAr && selectedProduct.name_ar ? selectedProduct.name_ar : selectedProduct.name}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Barcode: {selectedProduct.barcode} | Batch: {selectedProduct.batch_number}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">
                  {isAr ? 'دواعي الاستعمال والتوجيهات الطبية:' : 'Clinical Indications & Information:'}
                </span>
                <p className="text-slate-600 leading-relaxed">
                  {isAr && selectedProduct.description_ar ? selectedProduct.description_ar : selectedProduct.description}
                </p>
                {selectedProduct.dosage && (
                  <div className="pt-2 border-t border-slate-200 text-teal-800 font-semibold">
                    {isAr ? 'الجرعة المقترحة:' : 'Standard Dosage:'} {selectedProduct.dosage}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{isAr ? 'صلاحية الدفعة الحالية:' : 'Batch Expiry Date:'}</span>
                <span className="font-bold font-mono text-slate-800">{selectedProduct.expiry_date}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-teal-700 font-mono">
                  {selectedProduct.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ms-1">EGP</span>
              </div>

              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                {t('addToCart')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-400" />
                <span className="font-black text-sm">{t('cart')}</span>
                <span className="bg-teal-500/20 text-teal-300 text-xs px-2 py-0.5 rounded-full font-bold">
                  {cart.length}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-3">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                  <p className="text-sm font-bold text-slate-600">{isAr ? 'السلة فارغة' : 'Your cart is empty'}</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {isAr && item.product.name_ar ? item.product.name_ar : item.product.name}
                        </p>
                      </div>
                      <p className="text-xs text-teal-700 font-bold font-mono">
                        {item.product.price.toFixed(2)} EGP
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 bg-white rounded flex items-center justify-center text-xs font-bold text-slate-700"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 bg-white rounded flex items-center justify-center text-xs font-bold text-slate-700"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-semibold"
                        >
                          {isAr ? 'حذف' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Restricted Items Warning in Cart */}
            {hasRestrictedItems && (
              <div className="p-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">
                  {isAr
                    ? 'تحتوي السلة على أدوية تتطلب وصفة طبية صالحة. سيُطلب منك رفع صورة الروشتة في الخطوة التالية.'
                    : 'Your cart contains prescription medicines. An official doctor prescription must be uploaded during checkout.'}
                </p>
              </div>
            )}

            {/* Cart Summary & Checkout button */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}</span>
                    <span className="font-mono">{cartSubtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('deliveryFee')} (Express Courier)</span>
                    <span className="font-mono">{deliveryFee.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                    <span>{t('total')}</span>
                    <span className="text-teal-700 font-mono">{grandTotal.toFixed(2)} EGP</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isAr ? 'متابعة إتمام الطلب (الدفع عند الاستلام)' : 'Proceed to Checkout (Cash on Delivery)'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal (Home delivery only, Cash on Delivery, Prescription upload if required) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-400" />
                <h2 className="text-base font-black tracking-tight">
                  {isAr ? 'إتمام طلب التوصيل المنزلي' : 'Express Home Delivery Checkout'}
                </h2>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-5">
              {/* Payment Method Notice */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>{isAr ? 'الدفع نقداً عند الاستلام (Cash on Delivery) بعد استلام وفحص الأدوية.' : 'Cash on Delivery (COD) only. Pay the delivery rider upon receiving items.'}</span>
              </div>

              {/* Customer Contact & Address */}
              <div className="space-y-3 text-xs">
                <h3 className="font-black uppercase tracking-wider text-slate-700">
                  {isAr ? 'بيانات المستلم وعنوان التوصيل:' : 'Customer & Delivery Information:'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t('customerName')} *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Sarah Khaled"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t('customerPhone')} *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+20 100..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">{t('deliveryAddress')} *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Building, Street, Floor, Apartment #"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t('city')}</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="Cairo">Cairo</option>
                      <option value="Giza">Giza</option>
                      <option value="Alexandria">Alexandria</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">{t('orderNotes')}</label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={isAr ? 'ملاحظات خاصة بالمندوب (مثال: رن الجرس أو اتصل قبل الحضور)' : 'e.g. Ring doorbell or call upon arrival'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fulfilling Branch Selector */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 block">
                  {isAr ? 'الفرع المحدد للصرف وتجهيز الطلب:' : 'Assigned Dispensing Branch:'}
                </label>
                <select
                  value={fulfillmentBranchId}
                  onChange={(e) => setFulfillmentBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {isAr ? b.name_ar : b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* MANDATORY PRESCRIPTION UPLOAD IF RESTRICTED ITEMS */}
              {hasRestrictedItems && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/70 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800">
                    <FileText className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wider">
                        {isAr ? 'مطلوب رفع صورة الروشتة الطبية (إلزامي)' : 'Prescription Upload Required (Mandatory)'}
                      </h4>
                      <p className="text-[11px] text-rose-700">
                        {isAr
                          ? 'يحتوي طلبك على أدوية مقيدة. يجب رفع صورة الروشتة ليقوم الصيدلي بمراجعتها قبل الصرف.'
                          : 'Regulated medications present. Our licensed pharmacist must inspect your prescription.'}
                      </p>
                    </div>
                  </div>

                  {uploadedRxFile ? (
                    <div className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {uploadedRxFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedRxFile(null)}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        {isAr ? 'تغيير' : 'Change'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-rose-200 hover:bg-rose-100/40 transition-colors cursor-pointer text-center">
                        <Upload className="w-6 h-6 text-rose-500 mb-1" />
                        <span className="text-xs font-bold text-slate-800">
                          {isAr ? 'اختر صورة من جهازك أو التقط بكاميرا الهاتف' : 'Click to upload image/PDF or take photo'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Quick demo sample button */}
                      <button
                        type="button"
                        onClick={selectSamplePrescription}
                        className="w-full py-1.5 bg-rose-200/60 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'استخدام روشتة طبية تجريبية للاختبار السريع' : 'Attach Sample Medical Prescription (Fast Demo)'}
                      </button>
                    </div>
                  )}

                  {rxError && (
                    <p className="text-xs font-bold text-rose-600">{rxError}</p>
                  )}
                </div>
              )}

              {/* Total breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">{isAr ? 'إجمالي المطلوب كاش عند الباب:' : 'Total Payable on Delivery (Cash):'}</p>
                  <p className="text-[11px] text-slate-500">{isAr ? 'شامل الأدوية ورسوم التوصيل السريع' : 'Includes medications & express courier'}</p>
                </div>
                <p className="text-lg font-black text-teal-700 font-mono">
                  {grandTotal.toFixed(2)} EGP
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-1/3 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'رجوع' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  id="submit-online-order-btn"
                  className="w-2/3 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد إرسال الطلب (كاش)' : 'Confirm Order (Cash on Delivery)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmation Screen */}
      {confirmedOrderNumber && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                {isAr ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'تم إرسال رسالة واتساب و SMS لتأكيد تفاصيل الطلب وتتبع تحرك المندوب.'
                  : 'A WhatsApp & SMS confirmation has been dispatched with real-time tracking.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-bold">{isAr ? 'رقم طلبك:' : 'Your Order Reference:'}</p>
              <p className="text-2xl font-black text-teal-700 font-mono mt-0.5">
                {confirmedOrderNumber}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const num = confirmedOrderNumber;
                  setConfirmedOrderNumber(null);
                  setIsTrackerOpen(true);
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {isAr ? 'تتبع الطلب مباشرة' : 'Track Order Status'}
              </button>
              <button
                onClick={() => setConfirmedOrderNumber(null)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracker Modal */}
      {isTrackerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-6">
            <OrderTracker
              onClose={() => setIsTrackerOpen(false)}
              initialOrderNumber={confirmedOrderNumber || 'ORD-9012'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
