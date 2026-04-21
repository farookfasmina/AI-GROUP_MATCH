import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { LayoutDashboard, Users, UserPlus, Bell, Settings, User, ShieldCheck } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { unreadCount } = useContext(NotificationContext);
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Matches', path: '/matches', icon: UserPlus },
    { name: 'Study Groups', path: '/groups', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Preferences', path: '/preferences', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const { user } = useAuth();
  const filteredMenuItems = user?.is_platform_admin 
    ? [...menuItems, { name: 'Admin Panel', path: '/admin', icon: ShieldCheck }]
    : menuItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 h-[calc(100vh-64px)] fixed top-16 left-0 hidden md:block z-20">
      <div className="p-4 space-y-1 mt-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
              }`}
            >
              <div className="relative">
                 <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                 {item.name === 'Notifications' && unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                   </span>
                 )}
              </div>
              <span className="flex-1">{item.name}</span>
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
