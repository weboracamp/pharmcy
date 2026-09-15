import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Order, OrderStatus } from '../../types';
import {
  Bike,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  Banknote,
  ShieldCheck,
  ChevronRight,
  PackageCheck,
  LogOut
} from 'lucide-react';

interface DriverViewProps {
  onExitToStore?: () => void;
}

export const DriverView: React.FC<DriverViewProps> = ({ onExitToStore }) => {
  const {
    t,
    language,
    orders,
    updateOrderStatus,
    currentUser,
    allProfiles,
    logoutUser,
    branches
  } = usePharmacy();

  const isAr = language === 'ar';
  const driverProfiles = allProfiles.filter(p => p.role === 'driver');

  // Currently assigned orders to this driver
  const driverOrders = orders.filter(o => o.driver_id === currentUser.id);
  const activeOrders = driverOrders.filter(o => o.status === 'confirmed' || o.status === 'out_for_delivery');
  const completedOrders = driverOrders.filter(o => o.status === 'delivered');

  // Driver metrics
  const totalCashCollected = completedOrders.reduce((sum, o) => sum + o.total, 0);

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleStatusAdvance = (orderId: string, currentStatus: OrderStatus) => {
    if (currentStatus === 'confirmed' || currentStatus === 'pending') {
      updateOrderStatus(orderId, 'out_for_delivery');
    } else if (currentStatus === 'out_for_delivery') {
      updateOrderStatus(orderId, 'delivered');
    }
    // Update local modal if open
    setSelectedOrder(prev => {
      if (prev && prev.id === orderId) {
        const nextStatus = currentStatus === 'out_for_delivery' ? 'delivered' : 'out_for_delivery';
        return { ...prev, status: nextStatus };
      }
      return prev;
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Mobile-friendly Header with Driver Identity & Shift stats */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser.full_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-400"
              />
              <span className="absolute bottom-0 end-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-teal-400" />
                <h1 className="text-base font-black tracking-tight">{currentUser.full_name}</h1>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? 'مندوب توصيل معتمد' : 'Express Pharmacy Courier'}
              </p>
            </div>
          </div>

          {/* Actions: Exit to Store */}
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (onExitToStore) {
                  onExitToStore();
                } else {
                  window.location.hash = '';
                  await logoutUser();
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer min-h-[36px] transition-colors"
              title={isAr ? 'العودة للمتجر' : 'Exit to Store'}
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'خروج للمتجر' : 'Exit to Store'}</span>
            </button>
          </div>
        </div>

        {/* Driver Shift Summary metrics */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-800">
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'قيد التوصيل' : 'Active'}</span>
            <span className="text-lg font-black text-amber-400">{activeOrders.length}</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'تم التسليم' : 'Delivered'}</span>
            <span className="text-lg font-black text-emerald-400">{completedOrders.length}</span>
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'نقد للتحصيل' : 'Cash Remit'}</span>
            <span className="text-sm font-black text-teal-300 font-mono mt-0.5 block">{totalCashCollected.toFixed(0)} EGP</span>
          </div>
        </div>
      </div>

      {/* Assigned Orders List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'طلبات التوصيل المسندة إليك اليوم' : 'Assigned Deliveries Queue'}</span>
          </h2>
          <span className="text-xs font-bold text-slate-500">
            {driverOrders.length} {isAr ? 'طلب' : 'orders'}
          </span>
        </div>

        {driverOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-2">
            <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isAr ? 'لا توجد طلبات مسندة إليك حالياً' : 'No deliveries assigned to you right now'}
            </p>
            <p className="text-xs text-slate-500">
              {isAr ? 'سيظهر هنا أي طلب يتم إسناده إليك من قبل إدارة الصيدلية' : 'Check with your branch manager or wait for new dispatched orders.'}
            </p>
          </div>
        ) : (
          driverOrders.map(order => {
            const isDelivered = order.status === 'delivered';
            const isOut = order.status === 'out_for_delivery';
            const branch = branches.find(b => b.id === order.branch_id);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isDelivered
                    ? 'border-slate-200 opacity-75'
                    : isOut
                      ? 'border-blue-300 shadow-md ring-2 ring-blue-500/10'
                      : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* Top order meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {order.order_number}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isDelivered ? 'bg-emerald-100 text-emerald-800' :
                        isOut ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-xs text-slate-400 block">{isAr ? 'كاش عند الاستلام' : 'COD Amount'}</span>
                      <span className="text-sm font-black text-teal-700 font-mono">
                        {order.total.toFixed(2)} EGP
                      </span>
                    </div>
                  </div>

                  {/* Customer Contact & Address */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{order.customer_name}</span>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{isAr ? 'اتصال' : 'Call'}</span>
                      </a>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        {order.delivery_address}, {order.city}
                      </p>
                    </div>
                    {order.notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                        Note: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Prescription review badge */}
                  {order.requires_prescription && (
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-700">
                      <span className="flex items-center gap-1 font-semibold">
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        {isAr ? 'روشتة طبية معتمدة' : 'Prescription Verified'}
                      </span>
                      {order.prescription?.file_url && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-teal-700 font-bold hover:underline cursor-pointer"
                        >
                          {isAr ? 'معاينة الروشتة' : 'View Rx'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Button: Status advance */}
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {isAr ? 'تفاصيل الأدوية' : 'Items'}
                    </button>

                    {!isDelivered ? (
                      <button
                        onClick={() => handleStatusAdvance(order.id, order.status)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isOut
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-700/20'
                        }`}
                      >
                        {isOut ? (
                          <>
                            <Banknote className="w-4 h-4" />
                            <span>{isAr ? 'تم التسليم وتحصيل الكاش' : 'Mark Delivered & Collect COD'}</span>
                          </>
                        ) : (
                          <>
                            <Bike className="w-4 h-4" />
                            <span>{isAr ? 'بدء التوصيل (Out for delivery)' : 'Start Delivery (Out)'}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'تم التسليم بنجاح' : 'Delivered & Settled'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Driver Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400">Order Reference</span>
                <p className="text-base font-black text-slate-900 font-mono">{selectedOrder.order_number}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Prescription Preview if attached */}
            {selectedOrder.prescription?.file_url && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-rose-600" />
                  Prescription Attachment
                </span>
                <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={selectedOrder.prescription.file_url}
                    alt="Prescription"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Items table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Delivery Package Items:</span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 text-xs">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="py-2 flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{isAr && item.product_name_ar ? item.product_name_ar : item.product_name}</p>
                      <p className="text-slate-500 text-[11px]">{item.quantity} units</p>
                    </div>
                    <span className="font-bold font-mono">{item.subtotal.toFixed(2)} EGP</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
