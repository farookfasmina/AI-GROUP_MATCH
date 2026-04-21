import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { BookOpen, LogOut, Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { currentUser, logout } = useContext(AuthContext);
  const { unreadCount, fetchUnreadCount } = useContext(NotificationContext);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Extra safety explicit fetch on mount since Navbar mounts heavily
  useEffect(() => { if (currentUser) fetchUnreadCount(); }, [currentUser]);

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 fixed top-0 left-0 w-full z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={currentUser ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-700 transition-colors">
                 <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">StudyMatch</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className="hidden sm:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-slate-700 leading-tight">
                    {currentUser.full_name}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {currentUser.university}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative p-2 rounded-full hover:bg-slate-100 transition-colors mr-2 cursor-pointer outline-none"
                  >
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white"></span>
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={isNotifOpen} 
                    onClose={() => setIsNotifOpen(false)} 
                  />
                </div>

                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
                <Link to="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Sign in</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
