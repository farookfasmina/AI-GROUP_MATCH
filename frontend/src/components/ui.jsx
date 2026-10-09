import { createContext, useCallback, useContext, useEffect, useId, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Star, X } from 'lucide-react';
import { initials } from '../lib/format';

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

// --- buttons: pills, primary is the blue-to-indigo gradient ---------------------------------

const BUTTON = {
  primary: 'bg-gradient-to-r from-[#4f7cff] to-[#5b4ff0] text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.7)] hover:brightness-110',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:brightness-110',
  soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, icon: Icon, ...rest }) {
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3.5 text-base' };
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        BUTTON[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, dot, ...rest }) {
  return (
    <button aria-label={label} title={label}
      className={cx('relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200', className)} {...rest}>
      <Icon className="h-5 w-5" />
      {dot && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
    </button>
  );
}

// --- badges -------------------------------------------------------------------------------

const TONES = {
  slate: 'bg-slate-100 text-slate-700',
  brand: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-800',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  white: 'bg-white/25 text-white',
};

export function Badge({ tone = 'slate', children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    proposed: ['amber', 'Invitation'], pending: ['amber', 'Waiting'], active: ['emerald', 'Active'],
    accepted: ['emerald', 'Accepted'], declined: ['rose', 'Declined'], closed: ['slate', 'Closed'],
    matched: ['emerald', 'Matched'], unmatched: ['slate', 'Not matched yet'],
  };
  const [tone, label] = map[status] || ['slate', status];
  return <Badge tone={tone}>{label}</Badge>;
}

// --- cards: big white rounded panels on the gradient ------------------------------------------

export function Card({ className, children, ...rest }) {
  return <div className={cx('card', className)} {...rest}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-6 pb-2 pt-6">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> {label}...
    </div>
  );
}

export function ErrorBox({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onRetry && <button onClick={onRetry} className="font-semibold underline">Try again</button>}
    </div>
  );
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// --- people -------------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-gradient-to-br from-pink-400 to-rose-500', 'bg-gradient-to-br from-amber-300 to-orange-500',
  'bg-gradient-to-br from-violet-400 to-purple-600', 'bg-gradient-to-br from-sky-400 to-blue-600',
  'bg-gradient-to-br from-emerald-400 to-teal-600', 'bg-gradient-to-br from-fuchsia-400 to-pink-600',
];

export function Avatar({ name, id = 0, size = 'md', className }) {
  const sizes = { xs: 'h-7 w-7 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  return (
    <div className={cx('flex shrink-0 items-center justify-center rounded-full font-semibold text-white', sizes[size], AVATAR_COLORS[id % AVATAR_COLORS.length], className)}>
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ people, max = 3, size = 'xs', ring = 'ring-white' }) {
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p) => <Avatar key={p.id} name={p.name} id={p.id} size={size} className={cx('ring-2', ring)} />)}
      {more > 0 && (
        <span className={cx('flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-slate-700 ring-2', ring)}>{more}</span>
      )}
    </div>
  );
}

// --- colour tiles (the amber / pink / violet / blue cards of the design) ---------------------

export const TILE_COLORS = [
  { tile: 'bg-gradient-to-br from-[#ffd36b] to-[#fbbd3f]', bar: 'bg-gradient-to-r from-[#fb923c] to-[#f97316]', track: 'bg-[#ffe29a]', ring: 'ring-[#fcc64d]' },
  { tile: 'bg-gradient-to-br from-[#f99be6] to-[#ee6fd4]', bar: 'bg-gradient-to-r from-[#fb7185] to-[#f43f5e]', track: 'bg-[#fbb6ef]', ring: 'ring-[#f283dc]' },
  { tile: 'bg-gradient-to-br from-[#c49bfb] to-[#a774f5]', bar: 'bg-gradient-to-r from-[#a855f7] to-[#9333ea]', track: 'bg-[#d8bcfd]', ring: 'ring-[#b588f8]' },
  { tile: 'bg-gradient-to-br from-[#8fb2ff] to-[#6d8cfa]', bar: 'bg-gradient-to-r from-[#6366f1] to-[#3b82f6]', track: 'bg-[#b7cbff]', ring: 'ring-[#7d9efc]' },
];

export function tileColor(i = 0) {
  return TILE_COLORS[Math.abs(i) % TILE_COLORS.length];
}

// A bright tile with white text and a two-tone strip at the bottom showing `progress` (0..1).
export function Tile({ color = 0, progress, children, className, as: As = 'div', ...rest }) {
  const c = tileColor(color);
  return (
    <As className={cx('relative flex flex-col overflow-hidden rounded-3xl text-white shadow-[0_12px_30px_-14px_rgba(49,46,129,0.55)]', c.tile, className)} {...rest}>
      <div className="flex-1 p-5">{children}</div>
      {progress !== undefined && (
        <div className={cx('h-3 w-full', c.track)}>
          <div className={cx('h-full', c.bar)} style={{ width: `${Math.max(4, Math.min(100, progress * 100))}%` }} />
        </div>
      )}
    </As>
  );
}

// --- score ring with the blue-to-indigo gradient ------------------------------------------------

export function ScoreRing({ score, size = 64, label = 'match', stroke }) {
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`; // colons from useId break url(#...)
  const value = Math.round((score || 0) * 100);
  const w = stroke || Math.max(5, Math.round(size / 11));
  const r = (size - w - 2) / 2;
  const c = 2 * Math.PI * r;
  const big = size >= 160;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${value}% compatibility`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#5b4ff0" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eef1f8" strokeWidth={w} fill={big ? '#f6f8fd' : 'none'} />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id})`} strokeWidth={w} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className={cx('font-extrabold tracking-tight text-slate-900', big ? 'text-6xl' : size >= 64 ? 'text-base' : 'text-sm')}>{value}%</span>
        {size >= 64 && <span className={cx('text-slate-500', big ? 'mt-3 text-base font-semibold' : 'mt-0.5 text-[10px]')}>{label}</span>}
      </div>
    </div>
  );
}

// --- inputs ---------------------------------------------------------------------------------

export function StarInput({ value, onChange, label }) {
  return (
    <div>
      {label && <p className="label">{label}</p>}
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5`}
            onClick={() => onChange(n)} className="rounded p-0.5 transition hover:scale-110">
            <Star className={cx('h-7 w-7', n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChoiceCards({ options, value, onChange, columns = 3 }) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };
  return (
    <div className={cx('grid grid-cols-1 gap-3', cols[columns])} role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={cx('rounded-2xl p-4 text-left transition',
              on ? 'bg-gradient-to-br from-[#4f7cff] to-[#5b4ff0] text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)]' : 'bg-slate-50 text-slate-800 hover:bg-slate-100')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{o.label}</span>
              <span className={cx('h-4 w-4 rounded-full border-2', on ? 'border-white bg-white ring-2 ring-inset ring-indigo-500' : 'border-slate-300')} />
            </div>
            {o.hint && <p className={cx('mt-1 text-xs', on ? 'text-indigo-100' : 'text-slate-500')}>{o.hint}</p>}
          </button>
        );
      })}
    </div>
  );
}

// --- overlays ---------------------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-6 pt-2">{footer}</div>}
      </div>
    </div>
  );
}

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx('pointer-events-auto flex max-w-md items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-xl',
            t.tone === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white')}>
            {t.tone === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const STAT_TONES = {
  brand: 'from-[#4f7cff] to-[#5b4ff0]', emerald: 'from-emerald-400 to-teal-500', amber: 'from-amber-300 to-orange-500',
  sky: 'from-sky-400 to-blue-500', rose: 'from-pink-400 to-rose-500', violet: 'from-violet-400 to-purple-600',
};

export function Stat({ label, value, hint, icon: Icon, tone = 'brand' }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && <div className={cx('flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-white', STAT_TONES[tone])}><Icon className="h-5 w-5" /></div>}
      </div>
    </Card>
  );
}

// Segmented pill tabs
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/70 p-1 shadow-sm backdrop-blur scrollbar-thin" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx('whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition',
            value === t.value ? 'bg-gradient-to-r from-[#4f7cff] to-[#5b4ff0] text-white shadow' : 'text-slate-600 hover:bg-white')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
