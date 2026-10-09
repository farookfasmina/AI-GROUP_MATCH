import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, BookOpen, CalendarDays, ClipboardCheck, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck,
  Sparkles, User, UserPlus, Users, UsersRound, X,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useInterval } from '../lib/hooks';
import { Avatar, cx } from './ui';

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/matches', label: 'My matches', icon: UserPlus },
  { to: '/groups', label: 'Study groups', icon: UsersRound },
  { to: '/sessions', label: 'Sessions', icon: CalendarDays },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  { to: '/preferences', label: 'Preferences', icon: Settings2 },
  { to: '/survey', label: 'Platform survey', icon: ClipboardCheck },
  { to: '/profile', label: 'Profile', icon: User },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: ShieldCheck, end: true },
  { to: '/admin/matching', label: 'AI matching', icon: Sparkles },
  { to: '/admin/groups', label: 'All groups', icon: UsersRound },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/admin/evaluation', label: 'Evaluation', icon: BarChart3 },
];

export function Logo({ light, to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f7cff] to-[#5b4ff0] text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)]">
        <UsersRound className="h-5 w-5" />
      </div>
      <span className={cx('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        StudyMatch <span className={light ? 'text-indigo-200' : 'text-indigo-600'}>AI</span>
      </span>
    </Link>
  );
}

function NavSection({ title, items, unread, onNavigate }) {
  return (
    <>
      <div className="px-6 pb-2 pt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <nav className="space-y-1 px-3">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
            className={({ isActive }) => cx('flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition',
              isActive ? 'bg-gradient-to-r from-[#4f7cff] to-[#5b4ff0] text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}>
            <item.icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && unread > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isAdmin = !!user?.is_platform_admin;
  const showStudent = !isAdmin || user?.profile_complete;

  const loadUnread = useCallback(() => {
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {});
  }, []);
  useEffect(() => {
    loadUnread();
  }, [location.pathname, loadUnread]);
  useInterval(loadUnread, 20000);
  useEffect(() => {
    window.addEventListener('sm:notifications', loadUnread);
    return () => window.removeEventListener('sm:notifications', loadUnread);
  }, [loadUnread]);

  const signOut = () => {
    logout();
    navigate('/login');
  };
  const close = () => setOpen(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo to={isAdmin ? '/admin' : '/dashboard'} />
        <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={close} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin">
        {isAdmin && <NavSection title="Administration" items={ADMIN_NAV} onNavigate={close} />}
        {showStudent && <NavSection title="Student" items={STUDENT_NAV} unread={unread} onNavigate={close} />}
      </div>
      <div className="m-3 rounded-3xl bg-slate-50 p-2">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.full_name} id={user?.id} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-white hover:text-rose-600">
          <LogOut className="h-[18px] w-[18px]" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 rounded-[28px] bg-white/95 shadow-[0_18px_50px_-24px_rgba(49,46,129,0.5)] backdrop-blur lg:fixed lg:inset-y-4 lg:left-4 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={close} />
          <aside className="absolute inset-y-2 left-2 w-72 rounded-[28px] bg-white">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[17rem]">
        <header className="relative z-30 flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo to={isAdmin ? '/admin' : '/dashboard'} /></div>
          <div className="flex-1" />
          {isAdmin && (
            <span className="hidden items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </span>
          )}
          {showStudent && (
            <Link to="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm hover:bg-white" aria-label={`${unread} unread notifications`}>
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          )}
          <Link to="/profile" className="hidden rounded-full ring-4 ring-white/70 sm:block" aria-label="Profile"><Avatar name={user?.full_name} id={user?.id} /></Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
