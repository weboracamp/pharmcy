import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import {
  Pill,
  ShoppingBag,
  Globe,
  MapPin,
  Search,
  Phone,
  Truck,
  LogOut,
  Building2,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  activeView?: 'store' | 'pos' | 'cashier' | 'admin' | 'driver';
  onSelectView?: (view: 'store' | 'pos' | 'cashier' | 'admin' | 'driver') => void;
  onOpenCart?: () => void;
  onOpenTracker?: () => void;
  onExitToStore?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView = 'store',
  onSelectView,
  onOpenCart,
  onOpenTracker,
  onExitToStore
}) => {
  const {
    t,
    language,
    setLanguage,
    currentRole,
    currentUser,
    branches,
    currentBranch,
    setCurrentBranch,
    cart
  } = usePharmacy();

  const isAr = language === 'ar';
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isStaffPortal = activeView !== 'store' && currentRole !== 'customer';

  // Handler to return to public store
  const handleExit = () => {
    if (onExitToStore) {
      onExitToStore();
    } else {
      window.location.hash = '';
      if (onSelectView) onSelectView('store');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Top Customer / Staff Bar */}
      {!isStaffPortal ? (
        // Public Customer Top Announcement Bar
        <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1.5 text-teal-300 font-medium">
                <Truck className="w-3.5 h-3.5 text-teal-400" />
                <span>{isAr ? 'توصيل منزلي سريع لجميع الأدوية • الدفع عند الاستلام' : 'Fast Home Delivery for all Medications • Cash on Delivery'}</span>
              </span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span className="hidden md:flex items-center gap-1 text-slate-400">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{isAr ? 'الخط الساخن: 19000' : 'Hotline: 19000 (24/7)'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Customer Track Order Link */}
              {onOpenTracker && (
                <button
                  onClick={onOpenTracker}
                  id="header-track-order-btn"
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t('trackOrder')}</span>
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                id="header-lang-toggle"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                title="Switch Language / تبديل اللغة"
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>{language === 'en' ? 'العربية' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Staff Portal Management Bar (Only shown when authenticated on #owner, #cashier, or #driver)
        <div className="bg-slate-950 text-slate-200 text-xs py-2 px-4 sm:px-6 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-950 text-teal-300 border border-teal-800">
                <Building2 className="w-3 h-3" />
                {currentRole === 'admin'
                  ? (isAr ? 'لوحة تحكم المالك' : 'Executive Owner Portal')
                  : currentRole === 'cashier'
                    ? (isAr ? 'محطة كاشير الفرع' : 'Branch Cashier Station')
                    : (isAr ? 'تطبيق التوصيل' : 'Delivery Dispatch')}
              </span>
              <span className="hidden sm:inline text-slate-400 text-xs">
                {language === 'ar' ? currentBranch.name_ar : currentBranch.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-slate-300 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{currentUser.full_name}</span>
              </div>

              {/* Clean Logout / Exit Button to return to public storefront */}
              <button
                onClick={handleExit}
                id="staff-exit-to-store-btn"
                className="bg-rose-600/90 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title={isAr ? 'الخروج والعودة للمتجر العام' : 'Exit to Public Store'}
              >
                <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'خروج للمتجر' : 'Exit to Store'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
              {isAr ? 'صيدلية فارماكير' : 'PharmaCare'}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {isAr ? 'رعاية صحية موثوقة • خدمة وتوصيل ٢٤ ساعة' : 'Trusted Healthcare & 24/7 Prescription Delivery'}
            </span>
          </div>
        </div>

        {/* Public Store Branch Location Selection */}
        {!isStaffPortal && (
          <div className="flex items-center gap-2 text-xs">
            <div className="hidden md:flex items-center gap-1.5 text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'التوصيل من فرع:' : 'Delivery from:'}</span>
            </div>
            <select
              id="customer-branch-select"
              value={currentBranch.id}
              onChange={(e) => {
                const b = branches.find(item => item.id === e.target.value);
                if (b) setCurrentBranch(b);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors max-w-[190px] sm:max-w-xs truncate cursor-pointer"
            >
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {language === 'ar' ? branch.name_ar : branch.name} ({branch.city})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Action: Customer Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isStaffPortal && onOpenCart && (
            <button
              onClick={onOpenCart}
              id="header-cart-btn"
              className="relative bg-teal-600 hover:bg-teal-700 text-white px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black shadow-md shadow-teal-600/20 transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cart')}</span>
              {totalCartCount > 0 && (
                <span className="bg-amber-400 text-slate-900 font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          )}

          {/* If in staff portal, provide quick indicator */}
          {isStaffPortal && (
            <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{currentUser.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
