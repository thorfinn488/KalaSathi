import React, { useState } from 'react';
import { Bell, Check, Clock, Package, Sparkles, X, ExternalLink, IndianRupee, ShieldCheck } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'quote' | 'payout' | 'system';
  timestamp: string;
  read: boolean;
  linkText?: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Wholesale RFQ Received',
    message: 'FabIndia Sustainable Crafts requested 120 units of Madhubani Wall Art with Custom Keepsake packaging.',
    type: 'quote',
    timestamp: '10 mins ago',
    read: false,
    linkText: 'Review Quotation'
  },
  {
    id: 'notif-2',
    title: 'Escrow Advance Released',
    message: '₹14,400 (40% raw material fund) credited to your registered cluster UPI account for Order #KS-7741.',
    type: 'payout',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Sample Order Dispatched',
    message: 'Courier tracking #INPOST-98412 generated for Channapatna Wooden Stacking Toy.',
    type: 'order',
    timestamp: 'Yesterday',
    read: true,
  },
  {
    id: 'notif-4',
    title: 'GI Registry Synchronized',
    message: 'Geographical Indication cluster verification token renewed for 2026-2027 fiscal year.',
    type: 'system',
    timestamp: '2 days ago',
    read: true,
  }
];

interface NotificationModalProps {
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, onNavigateTab }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markItemRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:p-6 sm:pt-20 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-5 space-y-4 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Live Artisan Dispatch &amp; Alerts</h3>
              <p className="text-[10px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread cluster updates` : 'All updates caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-amber-300 hover:text-amber-200"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markItemRead(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                item.read 
                  ? 'bg-white/[0.02] border-white/5 opacity-70' 
                  : 'bg-amber-500/[0.08] border-amber-500/30 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.type === 'quote' && <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />}
                  {item.type === 'payout' && <IndianRupee className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {item.type === 'order' && <Package className="w-4 h-4 text-cyan-400 shrink-0" />}
                  {item.type === 'system' && <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />}
                  <h4 className="text-xs font-black text-white">{item.title}</h4>
                </div>
                <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                  <Clock className="w-2.5 h-2.5" /> {item.timestamp}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {item.message}
              </p>

              {item.linkText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateTab) {
                      onNavigateTab('opportunities');
                      onClose();
                    }
                  }}
                  className="mt-2 text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                >
                  <span>{item.linkText}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500 border-t border-white/10 pt-2">
          WhatsApp &amp; SMS alerts active for verified registered artisan numbers
        </div>
      </div>
    </div>
  );
};
