import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorText } from '../api';
import { Logo } from '../components/Layout';
import { Button, ErrorBox } from '../components/ui';
import { homeFor, useAuth } from '../context/AuthContext';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-brand-900 to-brand-700 p-12 text-white lg:flex">
        <Logo light />
        <div>
          <h2 className="text-3xl font-bold leading-tight">Smarter study groups,<br />built around how you learn.</h2>
          <p className="mt-4 max-w-md text-brand-100">
            Subjects, skill level, free time and study style - matched by AI and improved by every group's feedback.
          </p>
        </div>
        <p className="text-sm text-brand-200">Horizon Campus · Faculty of Information Technology</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const me = await login(email, password);
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const fill = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your matches and groups."
      footer={<>New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" placeholder="you@university.lk"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="mb-1.5 text-sm font-medium text-brand-600 hover:underline">Forgot password?</Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" required className="input" placeholder="Your password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">Sign in</Button>
      </form>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => fill('student@demo.lk', 'Demo@1234')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-300">
            <span className="block font-semibold text-slate-800">Student</span>
            <span className="text-xs text-slate-500">student@demo.lk</span>
          </button>
          <button type="button" onClick={() => fill('admin@studymatch.lk', 'Admin@1234')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-300">
            <span className="block font-semibold text-slate-800">Admin</span>
            <span className="text-xs text-slate-500">admin@studymatch.lk</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Tap one to fill the form, then press Sign in.</p>
      </div>
    </AuthShell>
  );
}
