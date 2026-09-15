import React from 'react';
import { Sale, Branch } from '../../types';
import { Printer, CheckCircle, X } from 'lucide-react';

interface ThermalReceiptProps {
  sale: Sale;
  branch: Branch;
  onClose: () => void;
  language?: 'en' | 'ar';
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  sale,
  branch,
  onClose,
  language = 'en',
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Actions header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-teal-400">
            <Printer className="w-4 h-4" />
            {isAr ? 'إيصال البيع الحراري' : 'Thermal Receipt Preview'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              id="print-receipt-action-btn"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {isAr ? 'طباعة' : 'Print'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Paper Slip */}
        <div
          id="printable-receipt"
          className="p-6 overflow-y-auto bg-white text-slate-900 font-mono text-xs leading-relaxed"
        >
          <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
            <h2 className="text-base font-black tracking-tight uppercase">
              {isAr ? 'صيدليات فارماتشين' : 'PHARMACHAIN PHARMACY'}
            </h2>
            <p className="text-[11px] font-semibold text-slate-700">
              {isAr ? branch.name_ar : branch.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {isAr ? branch.address_ar : branch.address}
            </p>
            <p className="text-[10px] text-slate-500">Tel: {branch.phone}</p>
            <p className="text-[9px] text-slate-400 mt-1">Tax Reg # 492-881-209</p>
          </div>

          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'رقم الإيصال:' : 'Receipt #:'}</span>
              <span className="font-bold">{sale.receipt_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'التاريخ:' : 'Date:'}</span>
              <span>{new Date(sale.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isAr ? 'الكاشير:' : 'Cashier:'}</span>
              <span>{sale.cashier_name}</span>
            </div>
            {sale.customer_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'العميل:' : 'Customer:'}</span>
                <span>{sale.customer_name}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
            <div className="flex justify-between font-bold text-[11px] border-b border-slate-200 pb-1 mb-1">
              <span>{isAr ? 'الصنف / الكمية' : 'Item / Qty'}</span>
              <span>{isAr ? 'السعر' : 'Amount'}</span>
            </div>
            <div className="space-y-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="pr-2">
                    <p className="font-medium line-clamp-1">{isAr && item.name_ar ? item.name_ar : item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} x {item.unit_price.toFixed(2)} EGP
                    </p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">
                    {item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Totals */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span>{sale.subtotal.toFixed(2)} EGP</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>{isAr ? 'الخصم:' : 'Discount:'}</span>
                <span>-{sale.discount.toFixed(2)} EGP</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
              <span>{isAr ? 'الإجمالي المطلوب:' : 'TOTAL:'}</span>
              <span>{sale.total.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>{isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className="uppercase font-bold">{sale.payment_method}</span>
            </div>
            {sale.payment_method === 'cash' && sale.tendered_amount !== undefined && (
              <>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>{isAr ? 'المبلغ المستلم:' : 'Tendered:'}</span>
                  <span>{sale.tendered_amount.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-800">
                  <span>{isAr ? 'الباقي:' : 'Change:'}</span>
                  <span>{(sale.change_amount || 0).toFixed(2)} EGP</span>
                </div>
              </>
            )}
          </div>

          {/* Barcode & Footer Notice */}
          <div className="text-center pt-1 space-y-2">
            <div className="h-9 bg-slate-900 mx-auto rounded flex items-center justify-center text-[10px] font-mono tracking-widest text-white px-3">
              ||| {sale.receipt_no} |||
            </div>
            <p className="text-[10px] font-medium text-slate-600">
              {isAr ? 'شكراً لزيارتكم صيدليات فارماتشين' : 'Thank you for trusting PharmaChain'}
            </p>
            <p className="text-[8px] text-slate-400">
              {isAr
                ? 'لا يجوز استرجاع الأدوية بعد خروجها من الصيدلية وفقاً للقانون الصحي.'
                : 'Medications cannot be exchanged or refunded once unsealed as per health regulations.'}
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center no-print">
          <button
            onClick={onClose}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق ومتابعة البيع' : 'Close & Continue POS'}
          </button>
        </div>
      </div>
    </div>
  );
};
