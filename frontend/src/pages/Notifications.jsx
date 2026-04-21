import { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Bell, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { NotificationContext } from '../context/NotificationContext';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { markAllAsRead, unreadCount } = useContext(NotificationContext);

  const loadNotifications = () => {
    api.get('/notifications/').then(res => setNotifications(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    setLoading(true);
    await markAllAsRead();
    loadNotifications(); // Refresh page mapping locally to map is_read correctly
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pt-24 md:pl-64">
          <div className="max-w-4xl mx-auto pb-12">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Notifications</h1>
                <p className="text-slate-600 font-medium">Platform matching alerts and system updates.</p>
              </div>
              
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-full text-sm font-extrabold hover:bg-indigo-100 transition-colors border border-indigo-200 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {loading ? 'Syncing...' : 'Mark All As Read'}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className={`p-6 rounded-2xl border ${!n.is_read ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200'} flex items-start gap-5 shadow-sm hover:shadow transition-shadow relative overflow-hidden`}>
                  
                  {/* Decorative unread indicator strip */}
                  {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>}
                  
                  <div className={`p-3 rounded-full shrink-0 mt-1 ${!n.is_read ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-base leading-relaxed ${!n.is_read ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>{n.message}</p>
                    <p className="text-[11px] font-black text-slate-400 mt-2.5 uppercase tracking-widest">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  
                  {/* Visual Unread "NEW" badge */}
                  {!n.is_read && (
                    <span className="ml-auto bg-rose-100 text-rose-700 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-200">
                      New
                    </span>
                  )}
                </div>
              )) : (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-300">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Bell className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">Inbox Zero is achieved.</h3>
                  <p className="text-slate-500 font-medium">You have absolutely no alerts pending at this time in the system.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
