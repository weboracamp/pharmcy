import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { MessageSquare, Phone, X, CheckCircle2 } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { recentToast, clearToast } = usePharmacy();

  if (!recentToast) return null;

  const isWhatsapp = recentToast.channel === 'whatsapp';
  const isSms = recentToast.channel === 'sms';

  return (
    <div
      id="notification-toast"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
        isWhatsapp 
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
          : isSms
            ? 'bg-blue-950/90 border-blue-500/40 text-blue-100'
            : 'bg-slate-900/90 border-slate-700 text-white'
      }`}>
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isWhatsapp ? 'bg-emerald-600/30 text-emerald-400' : isSms ? 'bg-blue-600/30 text-blue-400' : 'bg-teal-600/30 text-teal-400'
        }`}>
          {isWhatsapp ? (
            <MessageSquare className="w-5 h-5" />
          ) : isSms ? (
            <Phone className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              {isWhatsapp ? 'WhatsApp API Dispatch' : isSms ? 'SMS Gateway Dispatch' : 'System Notification'}
            </span>
            <button
              onClick={clearToast}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm mt-1 leading-snug font-medium break-words">
            {recentToast.message}
          </p>
        </div>
      </div>
    </div>
  );
};
