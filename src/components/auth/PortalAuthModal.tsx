import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { supabase } from '../../lib/supabase';
import {
  ShieldCheck,
  Calculator,
  Lock,
  ArrowLeft,
  Store,
  Building2,
  CheckCircle2,
  User,
  AlertCircle,
  Loader2,
  Mail,
  HelpCircle,
  ExternalLink,
  Info
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
    branches,
    currentBranch,
    setCurrentBranch,
    setAuthenticatedUser
  } = usePharmacy();

  const isAr = language === 'ar';

  // Owner Form State
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  // Cashier Form State
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(currentBranch.id);

  // Driver Form State
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSetupHelp, setShowSetupHelp] = useState(false);

  // Owner Authentication Handler: Real Supabase Auth + public.profiles role verification
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!supabase) {
      setErrorMessage(
        isAr
          ? 'الاتصال بـ Supabase غير متوفر. يرجى التحقق من متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY'
          : 'Supabase client is not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env configuration.'
      );
      setIsLoading(false);
      return;
    }

    const cleanEmail = ownerEmail.trim();
    if (!cleanEmail || !ownerPassword) {
      setErrorMessage(
        isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and password.'
      );
      setIsLoading(false);
      return;
    }

    try {
      // 1. Strict Supabase Auth Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: ownerPassword
      });

      if (authError || !authData?.user) {
        setErrorMessage(
          authError?.message ||
            (isAr
              ? 'فشل التحقق من الهوية: البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : 'Invalid login credentials. Please verify your email and password in Supabase Auth.')
        );
        setIsLoading(false);
        return;
      }

      // 2. Fetch authenticated profile from public.profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Invalidate Supabase session immediately
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? `تم التحقق من الحساب في Supabase Auth، لكن لم يتم العثور على سجل في جدول profiles بمعرف المستخدم (${authData.user.id}). يرجى إضافة سجل المالك في جدول profiles.`
            : `Authenticated successfully in Supabase Auth, but no matching row was found in "public.profiles" for user ID (${authData.user.id}). Please insert an admin profile record in Supabase.`
        );
        setShowSetupHelp(true);
        setIsLoading(false);
        return;
      }

      // 3. Strictly verify that the profile role is 'admin'
      if (profile.role !== 'admin') {
        // Invalidate Supabase session immediately
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? `تم رفض الوصول: دور هذا الحساب هو "${profile.role}". يجب أن يكون الدور "admin" في جدول profiles للوصول إلى لوحة المالك.`
            : `Access Denied: This account has the role "${profile.role}". Only users with role "admin" in public.profiles can access the Owner console.`
        );
        setIsLoading(false);
        return;
      }

      // 4. Verification complete - grant access
      setAuthenticatedUser(profile);
      setIsLoading(false);
      onAuthenticated();
    } catch (err: any) {
      console.error('Owner login unexpected error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
      setIsLoading(false);
    }
  };

  // Cashier Authentication Handler: Real Supabase Auth + public.profiles role verification
  const handleCashierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!supabase) {
      setErrorMessage(isAr ? 'الاتصال بـ Supabase غير مهيأ' : 'Supabase is not configured.');
      setIsLoading(false);
      return;
    }

    const cleanEmail = cashierEmail.trim();
    if (!cleanEmail || !cashierPassword) {
      setErrorMessage(
        isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide cashier email and password.'
      );
      setIsLoading(false);
      return;
    }

    try {
      // 1. Strict Supabase Auth Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cashierPassword
      });

      if (authError || !authData?.user) {
        setErrorMessage(
          authError?.message ||
            (isAr
              ? 'بيانات دخول الكاشير غير صحيحة. يرجى التحقق من صحة الحساب في Supabase Auth.'
              : 'Invalid cashier credentials. Please check your email and password.')
        );
        setIsLoading(false);
        return;
      }

      // 2. Fetch authenticated profile from public.profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? 'تم التحقق من الحساب، لكن لم يتم العثور على ملف تعريف الكاشير في جدول profiles'
            : 'Cashier profile record not found in public.profiles table. Contact your pharmacy manager.'
        );
        setIsLoading(false);
        return;
      }

      // 3. Strictly verify role is cashier, manager, or admin
      const allowedRoles = ['cashier', 'manager', 'admin'];
      if (!allowedRoles.includes(profile.role)) {
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? `تم رفض الوصول: دور هذا الحساب هو "${profile.role}". يجب أن يكون الحساب مسجلاً بدور كاشير أو مدير فرع.`
            : `Access Denied: Account role "${profile.role}" is not authorized for cashier POS operations.`
        );
        setIsLoading(false);
        return;
      }

      // 4. Update branch context if profile has assigned branch
      if (profile.branch_id) {
        const branch = branches.find(b => b.id === profile.branch_id);
        if (branch) setCurrentBranch(branch);
      } else if (selectedBranchId) {
        const branch = branches.find(b => b.id === selectedBranchId);
        if (branch) setCurrentBranch(branch);
      }

      setAuthenticatedUser(profile);
      setIsLoading(false);
      onAuthenticated();
    } catch (err: any) {
      console.error('Cashier login error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during cashier login.');
      setIsLoading(false);
    }
  };

  // Driver Authentication Handler: Real Supabase Auth + public.profiles role verification
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!supabase) {
      setErrorMessage(isAr ? 'الاتصال بـ Supabase غير مهيأ' : 'Supabase is not configured.');
      setIsLoading(false);
      return;
    }

    const cleanEmail = driverEmail.trim();
    if (!cleanEmail || !driverPassword) {
      setErrorMessage(
        isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide driver email and password.'
      );
      setIsLoading(false);
      return;
    }

    try {
      // 1. Strict Supabase Auth Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: driverPassword
      });

      if (authError || !authData?.user) {
        setErrorMessage(
          authError?.message ||
            (isAr
              ? 'بيانات دخول المندوب غير صحيحة في Supabase Auth'
              : 'Invalid driver credentials. Please verify your email and password.')
        );
        setIsLoading(false);
        return;
      }

      // 2. Fetch authenticated profile from public.profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? 'لم يتم العثور على ملف تعريف السائق في جدول profiles'
            : 'Driver profile record not found in public.profiles table.'
        );
        setIsLoading(false);
        return;
      }

      // 3. Strictly verify role is driver or admin
      if (profile.role !== 'driver' && profile.role !== 'admin') {
        await supabase.auth.signOut();
        setErrorMessage(
          isAr
            ? `تم رفض الوصول: هذا الحساب بدور "${profile.role}" وليس مندوب توصيل`
            : `Access Denied: Account role "${profile.role}" is not authorized for delivery operations.`
        );
        setIsLoading(false);
        return;
      }

      setAuthenticatedUser(profile);
      setIsLoading(false);
      onAuthenticated();
    } catch (err: any) {
      console.error('Driver login error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during driver login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onExitToStore}
            id="portal-exit-btn"
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title={isAr ? 'العودة للمتجر العام' : 'Exit to Public Store'}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{isAr ? 'المتجر' : 'Store'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                portalType === 'owner'
                  ? 'bg-amber-600 text-white shadow-amber-900/40'
                  : portalType === 'cashier'
                  ? 'bg-teal-600 text-white shadow-teal-900/40'
                  : 'bg-blue-600 text-white shadow-blue-900/40'
              }`}
            >
              {portalType === 'owner' && <ShieldCheck className="w-6 h-6" />}
              {portalType === 'cashier' && <Calculator className="w-6 h-6" />}
              {portalType === 'driver' && <User className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  {portalType === 'owner' && (isAr ? 'بوابة إدارة المالك' : 'Owner / Admin Portal')}
                  {portalType === 'cashier' && (isAr ? 'محطة الكاشير ونقاط البيع' : 'Branch Cashier Station')}
                  {portalType === 'driver' && (isAr ? 'بوابة مندوب التوصيل' : 'Delivery Driver Portal')}
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                {portalType === 'owner' && (isAr ? 'تسجيل دخول آمن عبر Supabase Auth' : 'Verified via Supabase Auth & RLS')}
                {portalType === 'cashier' && (isAr ? 'إدارة الشيفت والمخزون والمبيعات' : 'Branch POS & Shift Operations')}
                {portalType === 'driver' && (isAr ? 'توصيل الطلبات وتحصيل الكاش' : 'Order delivery and COD collection')}
              </p>
            </div>
          </div>

          {/* Real Supabase Security Badge */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {isAr ? 'حماية Supabase Auth و RLS نشطة' : 'Supabase Auth & RLS Enforced'}
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              {portalType === 'owner' ? 'role = admin' : portalType === 'cashier' ? 'role = cashier/manager' : 'role = driver'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <p>{errorMessage}</p>
                {errorMessage.includes('profiles') && (
                  <button
                    type="button"
                    onClick={() => setShowSetupHelp(!showSetupHelp)}
                    className="text-[11px] font-bold underline text-rose-800 hover:text-rose-950 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>{isAr ? 'كيفية ربط المستخدم في Supabase' : 'How to link user profile in Supabase'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Setup / Onboarding Assistance Modal / Box */}
          {showSetupHelp && (
            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between font-bold text-amber-400">
                <span>{isAr ? 'إرشادات تسجيل المشرف في Supabase' : 'Supabase User Profile Quick Setup'}</span>
                <button
                  onClick={() => setShowSetupHelp(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                {isAr
                  ? 'إذا كنت قد أنشأت المستخدم في Supabase Authentication، نفذ هذا الاستعلام في SQL Editor لتعيين صلاحية المالك:'
                  : 'If you created your user in Supabase Auth > Users, run this in Supabase SQL Editor to link their admin profile:'}
              </p>
              <pre className="bg-slate-950 p-2.5 rounded-xl text-[10px] text-teal-300 font-mono overflow-x-auto whitespace-pre">
{`-- Insert/Update profile with admin role
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('<USER_UUID_FROM_AUTH>', 'owner@email.com', 'Pharmacy Owner', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
              </pre>
            </div>
          )}

          {/* OWNER LOGIN FORM */}
          {portalType === 'owner' && (
            <form onSubmit={handleOwnerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'البريد الإلكتروني للمالك / المشرف' : 'Owner / Admin Email'}</span>
                </label>
                <input
                  type="email"
                  id="owner-email-input"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'كلمة المرور في Supabase Auth' : 'Supabase Auth Password'}</span>
                </label>
                <input
                  type="password"
                  id="owner-password-input"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="owner-login-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق عبر Supabase...' : 'Authenticating with Supabase...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{isAr ? 'تسجيل الدخول والتحقق من الصلاحيات' : 'Sign In & Verify Owner Role'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* CASHIER LOGIN FORM */}
          {portalType === 'cashier' && (
            <form onSubmit={handleCashierSubmit} className="space-y-4">
              {/* Optional Branch Station Context */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isAr ? 'محطة الفرع' : 'Branch Station'}</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-60"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {isAr ? b.name_ar : b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cashier Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'البريد الإلكتروني للكاشير' : 'Cashier Account Email'}</span>
                </label>
                <input
                  type="email"
                  id="cashier-email-input"
                  value={cashierEmail}
                  onChange={(e) => setCashierEmail(e.target.value)}
                  placeholder="cashier@pharmacy.com"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Cashier Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <input
                  type="password"
                  id="cashier-password-input"
                  value={cashierPassword}
                  onChange={(e) => setCashierPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="cashier-login-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق من هوية الكاشير...' : 'Verifying Cashier Credentials...'}</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span>{isAr ? 'بدء جلسة العمل في الفرع' : 'Verify & Start Cashier Session'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* DRIVER LOGIN FORM */}
          {portalType === 'driver' && (
            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'البريد الإلكتروني للمندوب' : 'Driver Account Email'}</span>
                </label>
                <input
                  type="email"
                  id="driver-email-input"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  placeholder="driver@pharmacy.com"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <input
                  type="password"
                  id="driver-password-input"
                  value={driverPassword}
                  onChange={(e) => setDriverPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none disabled:opacity-60 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="driver-login-submit-btn"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري التحقق...' : 'Verifying Driver Account...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? 'فتح لوحة التوصيل' : 'Verify & Open Delivery App'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Clean Return to Store Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              onClick={onExitToStore}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
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
