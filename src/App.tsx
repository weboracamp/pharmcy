import React, { useState, useEffect } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Header } from './components/common/Header';
import { NotificationToast } from './components/common/NotificationToast';
import { FastPOS } from './components/pos/FastPOS';
import { OnlineStore } from './components/store/OnlineStore';
import { DriverView } from './components/driver/DriverView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CashierDashboard } from './components/cashier/CashierDashboard';
import { PortalAuthModal } from './components/auth/PortalAuthModal';
import {
  Phone,
  ShieldCheck,
  Truck,
  HeartPulse,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';

const PharmacyAppContent: React.FC = () => {
  const { currentUser, language, switchUserRole, logoutUser } = usePharmacy();
  const isAr = language === 'ar';

  const [currentView, setCurrentView] = useState<'store' | 'pos' | 'cashier' | 'admin' | 'driver'>('store');
  const [showPOSModal, setShowPOSModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'owner' | 'cashier' | 'driver' | null>(null);

  // Hidden Route Listener (#owner, #cashier, #driver)
  // Visiting the plain domain (or '/') ALWAYS defaults to the public storefront.
  // Owner/Cashier/Driver dashboards ONLY load if the URL explicitly contains the corresponding hash AND user is authenticated.
  useEffect(() => {
    const handleHashRouting = () => {
      const hash = window.location.hash.toLowerCase().trim();

      if (hash === '#owner' || hash === '#/owner' || hash === '#admin') {
        if (currentUser.role === 'admin') {
          setCurrentView('admin');
          setAuthModalType(null);
        } else {
          setCurrentView('store');
          setAuthModalType('owner');
        }
      } else if (hash === '#cashier' || hash === '#/cashier') {
        if (currentUser.role === 'cashier' || currentUser.role === 'manager') {
          setCurrentView('cashier');
          setAuthModalType(null);
        } else {
          setCurrentView('store');
          setAuthModalType('cashier');
        }
      } else if (hash === '#driver' || hash === '#/driver') {
        if (currentUser.role === 'driver') {
          setCurrentView('driver');
          setAuthModalType(null);
        } else {
          setCurrentView('store');
          setAuthModalType('driver');
        }
      } else {
        // Root path / no hash / unrecognized hash:
        // Always strictly show public storefront
        setAuthModalType(null);
        setCurrentView('store');
      }
    };

    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
    return () => window.removeEventListener('hashchange', handleHashRouting);
  }, [currentUser.role]);

  // Clean Exit to Store Handler
  const handleExitToStore = async () => {
    window.location.hash = '';
    setAuthModalType(null);
    await logoutUser();
    switchUserRole('customer');
    setCurrentView('store');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-teal-500 selection:text-white font-sans antialiased">
      {/* Global Header (Strictly hides staff roles on customer store) */}
      <Header
        activeView={currentView}
        onSelectView={(v) => {
          if (v === 'pos') {
            setShowPOSModal(true);
          } else {
            setCurrentView(v);
          }
        }}
        onExitToStore={handleExitToStore}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentView === 'store' && <OnlineStore />}
        {currentView === 'pos' && <FastPOS onClose={() => setCurrentView('cashier')} />}
        {currentView === 'cashier' && (
          <CashierDashboard
            onOpenPOS={() => setShowPOSModal(true)}
            onExitToStore={handleExitToStore}
          />
        )}
        {currentView === 'admin' && (
          <AdminDashboard
            onExitToStore={handleExitToStore}
          />
        )}
        {currentView === 'driver' && (
          <DriverView
            onExitToStore={handleExitToStore}
          />
        )}
      </main>

      {/* Fast POS Fullscreen Overlay Modal (Staff tool) */}
      {showPOSModal && (
        <FastPOS onClose={() => setShowPOSModal(false)} />
      )}

      {/* Hidden Portal Authentication Modal (Triggered by #owner, #cashier, #driver) */}
      {authModalType && (
        <PortalAuthModal
          portalType={authModalType}
          onAuthenticated={() => {
            setAuthModalType(null);
            if (authModalType === 'owner') {
              setCurrentView('admin');
            } else if (authModalType === 'cashier') {
              setCurrentView('cashier');
            } else if (authModalType === 'driver') {
              setCurrentView('driver');
            }
          }}
          onExitToStore={handleExitToStore}
        />
      )}

      {/* Public Storefront Footer (Customer-Only, No Technical/Admin Jargon) */}
      {currentView === 'store' && (
        <footer className="bg-white border-t border-slate-200 mt-auto py-8 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Customer Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'أدوية أصلية ومضمونة 100%' : '100% Genuine Medications'}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {isAr ? 'توريد مباشر ومخزن في بيئة معقمة ومبردة' : 'Directly sourced & climate-controlled'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'توصيل سريع لباب المنزل' : 'Express Home Delivery'}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {isAr ? 'في غضون 30–45 دقيقة مع خيار الدفع عند الاستلام' : 'Within 30–45 mins with Cash on Delivery'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    {isAr ? 'صيادلة متاحون للاستشارة' : 'Licensed Pharmacist Support'}
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {isAr ? 'مراجعة وتدقيق الروشتات الطبية قبل الصرف' : 'Prescription verification before dispatch'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Info & Contact */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="font-semibold text-slate-700">
                  {isAr ? 'صيدليات الشفاء للخدمة الدوائية المتميزة' : 'Al-Shifa Healthcare Pharmacy Chain'}
                </span>
                <span className="text-slate-300">|</span>
                <span>{isAr ? 'خدمة وتوصيل 24 ساعة' : '24/7 Delivery & Healthcare'}</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-teal-700">
                  <Phone className="w-3.5 h-3.5" />
                  <span>19888</span>
                </div>
                <span className="text-slate-300">|</span>
                <span>{isAr ? 'جميع الحقوق محفوظة © 2026' : '© 2026 All Rights Reserved'}</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Real-time Order & Delivery Notifications */}
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <PharmacyAppContent />
    </PharmacyProvider>
  );
}
