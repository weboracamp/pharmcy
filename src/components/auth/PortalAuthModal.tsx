import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Profile, Branch } from '../../types';
import {
  ShieldCheck,
  Calculator,
  Lock,
  ArrowLeft,
  Store,
  Building2,
  CheckCircle2,
  User,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface PortalAuthModalProps {
  portalType: 'owner' | 'cashier' | 'driver';
  onAuthenticated: () => void;
  onExitToStore: () => void;
}

export const PortalAuthModal: React.FC<PortalAuthModalProps> = ({
  portalType,
  onAuthenticated,
  onExitToStore
}) => {
  const {
    language,
    t,
    allProfiles,
    branches,
    currentBranch,
    setCurrentBranch,
    switchUserRole
  } = usePharmacy();

  const isAr = language === 'ar';

  // State for Owner Login
  const [ownerEmail, setOwnerEmail] = useState('admin@pharmachain.com');
  const [ownerPassword, setOwnerPassword] = useState('••••••••');
  
  // State for Cashier Login
  const [selectedBranchId, setSelectedBranchId] = useState<string>(currentBranch.id);
  const branchCashiers = allProfiles.filter(
    p => p.role === 'cashier' && p.branch_id === selectedBranchId
  );
  const [selectedCashierId, setSelectedCashierId] = useState<string>(
    branchCashiers[0]?.id || ''
  );
  const [cashierPin, setCashierPin] = useState('1234');

  // State for Driver Login
  const branchDrivers = allProfiles.filter(
    p => p.role === 'driver' && (!p.branch_id || p.branch_id === selectedBranchId)
  );
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    branchDrivers[0]?.id || ''
  );

  const [errorMessage, setErrorMessage] = useState('');

  // Handle branch change in cashier portal
  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    const branch = branches.find(b => b.id === branchId);
    if (branch) setCurrentBranch(branch);

    const newCashiers = allProfiles.filter(
      p => p.role === 'cashier' && p.branch_id === branchId
    );
    if (newCashiers.length > 0) {
      setSelectedCashierId(newCashiers[0].id);
    } else {
      setSelectedCashierId('');
    }
  };

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const adminProfile = allProfiles.find(p => p.role === 'admin');
    if (adminProfile) {
      switchUserRole('admin');
      onAuthenticated();
    } else {
      setErrorMessage(isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials');
    }
  };

  const handleCashierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const targetBranch = branches.find(b => b.id === selectedBranchId) || currentBranch;
    setCurrentBranch(targetBranch);

    if (selectedCashierId) {
      switchUserRole('cashier', targetBranch.id, selectedCashierId);
      onAuthenticated();
    } else {
      // Fallback: switch to cashier role at this branch
      switchUserRole('cashier', targetBranch.id);
      onAuthenticated();
    }
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switchUserRole('driver', undefined, selectedDriverId);
    onAuthenticated();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onExitToStore}
            id="portal-exit-btn"
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title={isAr ? 'العودة للمتجر العام' : 'Exit to Public Store'}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? 'المتجر' : 'Store'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              portalType === 'owner' 
                ? 'bg-amber-600 text-white shadow-amber-900/40' 
                : portalType === 'cashier'
                  ? 'bg-teal-600 text-white shadow-teal-900/40'
                  : 'bg-blue-600 text-white shadow-blue-900/40'
            }`}>
              {portalType === 'owner' && <ShieldCheck className="w-6 h-6" />}
              {portalType === 'cashier' && <Calculator className="w-6 h-6" />}
              {portalType === 'driver' && <User className="w-6 h-6" />}
            </div>

            <div>
              <h2 className="text-lg font-black text-white">
                {portalType === 'owner' && (isAr ? 'بوابة إدارة المالك' : 'Owner / Admin Portal')}
                {portalType === 'cashier' && (isAr ? 'محطة الكاشير ونقاط البيع' : 'Branch Cashier Station')}
                {portalType === 'driver' && (isAr ? 'بوابة مندوب التوصيل' : 'Delivery Driver Portal')}
              </h2>
              <p className="text-xs text-slate-400">
                {portalType === 'owner' && (isAr ? 'الوصول لجميع الفروع والتقارير' : 'Central chain oversight & analytics')}
                {portalType === 'cashier' && (isAr ? 'إدارة الشيفت والمخزون والمبيعات' : 'Independent branch POS & shift sessions')}
                {portalType === 'driver' && (isAr ? 'توصيل الطلبات وتحصيل الكاش' : 'Order delivery and COD collection')}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {portalType === 'owner' && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'البريد الإلكتروني للمالك' : 'Owner / Admin Email'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr ? 'الحساب الافتراضي: Dr. Kareem Mansour' : 'Default: Dr. Kareem Mansour (Chief Pharmacist)'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور' : 'Password / Security PIN'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="owner-login-submit-btn"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'دخول لوحة تحكم المالك' : 'Access Owner Dashboard'}</span>
                </button>
              </div>
            </form>
          )}

          {portalType === 'cashier' && (
            <form onSubmit={handleCashierSubmit} className="space-y-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'اختر الفرع الحالي' : 'Select Branch Station'}</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {isAr ? b.name_ar : b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cashier Staff Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'الكاشير المناوب في هذا الفرع' : 'On-Duty Cashier at this Branch'}</span>
                </label>
                {branchCashiers.length > 0 ? (
                  <select
                    value={selectedCashierId}
                    onChange={(e) => setSelectedCashierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {branchCashiers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    {isAr ? 'لا يوجد كاشير مسجل بهذا الفرع بعد. يمكنك الدخول كحساب افتراضي للفرع.' : 'No cashiers assigned yet. Will log in with branch profile.'}
                  </div>
                )}
              </div>

              {/* Security PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'الرقم السري للكاشير (PIN)' : 'Cashier Security PIN'}</span>
                </label>
                <input
                  type="password"
                  value={cashierPin}
                  onChange={(e) => setCashierPin(e.target.value)}
                  maxLength={6}
                  placeholder="1234"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tracking-widest focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="cashier-login-submit-btn"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{isAr ? 'بدء جلسة العمل في الفرع' : 'Start Cashier Session'}</span>
                </button>
              </div>
            </form>
          )}

          {portalType === 'driver' && (
            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'اختر حساب المندوب' : 'Select Courier Driver'}
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {branchDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="driver-login-submit-btn"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'فتح لوحة التوصيل' : 'Open Delivery App'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Clean Return to Store Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={onExitToStore}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'العودة لمتجر الأدوية والمنتجات العام' : 'Return to Public Pharmacy Storefront'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
