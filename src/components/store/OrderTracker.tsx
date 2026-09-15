import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Bike,
  ShieldCheck,
  MessageSquare,
  Phone,
  FileText,
  MapPin,
  AlertCircle,
  X
} from 'lucide-react';

interface OrderTrackerProps {
  onClose?: () => void;
  initialOrderNumber?: string;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ onClose, initialOrderNumber = '' }) => {
  const { orders, branches, allProfiles, notifications, language, t } = usePharmacy();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState(initialOrderNumber);
  const [searched, setSearched] = useState(Boolean(initialOrderNumber));

  // Find order by order_number or customer_phone
  const order = orders.find(o => 
    o.order_number.toLowerCase() === searchQuery.trim().toLowerCase() ||
    o.customer_phone.replace(/\s+/g, '') === searchQuery.trim().replace(/\s+/g, '')
  );

  const orderNotifications = order ? notifications.filter(n => n.order_id === order.id) : [];
  const assignedBranch = order ? branches.find(b => b.id === order.branch_id) : null;
  const assignedDriver = order && order.driver_id ? allProfiles.find(p => p.id === order.driver_id) : null;

  const steps: { key: OrderStatus; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    {
      key: 'pending',
      labelEn: 'Pending Review',
      labelAr: 'قيد مراجعة الصيدلي',
      descEn: 'Order received. Pharmacist verifying medication & prescription.',
      descAr: 'تم استلام الطلب ويقوم الصيدلي بمطابقة الروشتة والأدوية.'
    },
    {
      key: 'confirmed',
      labelEn: 'Confirmed & Packed',
      labelAr: 'تم التأكيد والتجهيز',
      descEn: 'Items picked from cold storage / shelves and securely packaged.',
      descAr: 'تم تجهيز الأدوية وتغليفها معايير التخزين الصحي الآمن.'
    },
    {
      key: 'out_for_delivery',
      labelEn: 'Out for Delivery',
      labelAr: 'خرج للتوصيل',
      descEn: 'Assigned to delivery courier. Heading to your address.',
      descAr: 'الطلب في الطريق مع مندوب التوصيل المعتمد.'
    },
    {
      key: 'delivered',
      labelEn: 'Delivered',
      labelAr: 'تم التسليم',
      descEn: 'Order handed over. Payment collected upon receipt.',
      descAr: 'تم تسليم الأدوية بنجاح وتحصيل المبلغ كاش.'
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'out_for_delivery': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">
              {isAr ? 'تتبع حالة طلبك أونلاين' : 'Track Your Online Delivery'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'أدخل رقم الطلب أو رقم الهاتف المسجل به' : 'Enter order number or registered phone'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="order-tracker-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'مثال: ORD-9012 أو +201094448877' : 'e.g. ORD-9012 or +201094448877'}
              className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setSearched(true)}
            id="order-tracker-search-btn"
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-700/20 cursor-pointer"
          >
            {isAr ? 'بحث' : 'Track'}
          </button>
        </div>

        {/* Not Found state */}
        {searched && !order && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isAr ? 'لم يتم العثور على طلب بهذا الرقم' : 'No order found with this reference'}
            </p>
            <p className="text-xs text-slate-500">
              {isAr ? 'يرجى التأكد من كتابة الرقم بشكل صحيح (مثال: ORD-9012)' : 'Try checking your order number (e.g. ORD-9012)'}
            </p>
          </div>
        )}

        {/* Order Details Found */}
        {order && (
          <div className="space-y-6">
            {/* Top Order Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-900 font-mono">
                    {order.order_number}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                    order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'confirmed' ? 'bg-teal-100 text-teal-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {steps.find(s => s.key === order.status)?.[isAr ? 'labelAr' : 'labelEn'] || order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'فرع الصرف:' : 'Fulfilling Branch:'} <span className="font-semibold text-slate-700">{assignedBranch?.name}</span>
                </p>
              </div>

              <div className="text-end">
                <p className="text-xs text-slate-500">{isAr ? 'المبلغ المطلوب (كاش عند الاستلام):' : 'COD Amount Due:'}</p>
                <p className="text-lg font-black text-teal-700 font-mono">
                  {order.total.toFixed(2)} EGP
                </p>
              </div>
            </div>

            {/* Visual 4-Step Progress Bar */}
            <div className="py-2">
              <div className="relative flex items-center justify-between">
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 z-0">
                  <div
                    className="h-full bg-teal-600 transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%` }}
                  />
                </div>

                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isDone
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-4 ring-white'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 whitespace-nowrap ${
                        isCurrent ? 'text-teal-700 font-black' : isDone ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {isAr ? step.labelAr : step.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Courier info if out for delivery */}
            {order.status === 'out_for_delivery' && assignedDriver && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={assignedDriver.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                    alt={assignedDriver.full_name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-blue-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-black text-slate-900">{assignedDriver.full_name}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'مندوب التوصيل المعتمد لصيدلية فارماتشين' : 'Authorized Express Pharmacy Courier'}
                    </p>
                  </div>
                </div>

                {assignedDriver.phone && (
                  <a
                    href={`tel:${assignedDriver.phone}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isAr ? 'اتصال بالمندوب' : 'Call Rider'}</span>
                  </a>
                )}
              </div>
            )}

            {/* Prescription Status Banner if order required Rx */}
            {order.requires_prescription && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">
                    {isAr ? 'الوصفة الطبية (الروشتة):' : 'Prescription Review:'}
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    order.prescription?.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    order.prescription?.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {order.prescription?.status?.toUpperCase() || 'ATTACHED'}
                  </span>
                </div>
                {order.prescription?.file_url && (
                  <a
                    href={order.prescription.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 hover:underline font-bold text-xs"
                  >
                    {isAr ? 'عرض الملف المرفق' : 'View Upload'}
                  </a>
                )}
              </div>
            )}

            {/* Ordered Items List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
                {isAr ? 'الأدوية والمنتجات المطلوبة:' : 'Prescribed & OTC Items:'}
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map(item => (
                  <div key={item.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        {isAr && item.product_name_ar ? item.product_name_ar : item.product_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.quantity} x {item.unit_price.toFixed(2)} EGP
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900 font-mono">
                      {item.subtotal.toFixed(2)} EGP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live WhatsApp / SMS Alerts Log for this order */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'سجل الإشعارات المرسلة لهاتفك (WhatsApp / SMS):' : 'Automated WhatsApp & SMS Updates Sent:'}</span>
              </div>
              <div className="space-y-2">
                {orderNotifications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    {isAr ? 'لم تُرسل أية رسائل حتى الآن' : 'No notifications dispatched yet.'}
                  </p>
                ) : (
                  orderNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs flex items-start gap-2.5"
                    >
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        notif.channel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {notif.channel}
                      </span>
                      <div className="flex-1">
                        <p className="text-slate-800 font-medium">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          {new Date(notif.sent_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
