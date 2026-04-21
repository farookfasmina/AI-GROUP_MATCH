import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, UserPlus, Clock } from 'lucide-react';
import api from '../api';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Notification sync error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptMatch = async (senderId, notifId) => {
    try {
      // 1. Initialize the private group with the sender
      await api.post(`/matches/${senderId}/init-private-group`);
      // 2. Mark individual notification as read
      await handleMarkRead(notifId);
      alert("Study Match Accepted! A private collaboration group has been created.");
    } catch (err) {
      console.error("Match acceptance failure", err);
      alert("Failed to initialize match group.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-0 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-fade-in-down origin-top-right">
       {/* Premium Branding Line */}
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-600 to-emerald-500" />
       
       {/* Header */}
       <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Alerts</h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </div>
          <button 
            onClick={handleClearAll}
            className="text-[10px] font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Clear History
          </button>
       </div>

       {/* Notification List */}
       <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {loading && notifications.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3 opacity-40">
               <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Hub...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center space-y-4">
               <div className="mx-auto h-14 w-14 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 rotate-12">
                  <Bell className="h-7 w-7 text-slate-300" />
               </div>
               <p className="text-sm font-bold text-slate-400">All signals are clear.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
               {notifications.map(n => (
                 <div 
                   key={n.id} 
                   className={`p-5 transition-all hover:bg-slate-50/80 group relative ${n.is_read ? 'opacity-50' : 'bg-white border-l-4 border-indigo-600'}`}
                 >
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                           {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                      {!n.is_read && (
                        <button 
                          onClick={() => handleMarkRead(n.id)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Mark Read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                   </div>
                   
                   <p className={`text-sm leading-relaxed mb-4 ${n.is_read ? 'font-medium text-slate-500' : 'font-bold text-slate-800'}`}>
                     {n.message}
                   </p>

                   {/* Actionable Match Request UI */}
                   {n.type === 'match_request' && !n.is_read && (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => handleAcceptMatch(n.payload_id, n.id)}
                          className="flex-1 bg-indigo-600 text-white text-[10px] font-bold py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <UserPlus className="h-3 w-3" /> Accept
                        </button>
                        <button 
                          onClick={() => handleMarkRead(n.id)}
                          className="px-4 bg-slate-100 text-slate-500 text-[10px] font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                          Dismiss
                        </button>
                     </div>
                   )}
                 </div>
               ))}
            </div>
          )}
       </div>

       {/* Footer */}
       <div className="p-4 bg-slate-50/50 text-center border-t border-slate-100">
          <button 
            onClick={onClose}
            className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all"
          >
            Collapse Command Center
          </button>
       </div>
    </div>
  );
}
