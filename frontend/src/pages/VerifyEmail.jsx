import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorText } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { homeFor, useAuth } from '../context/AuthContext';
import { AuthShell } from './Login';

// One box for the 6-digit code; phones offer the code from the email automatically.
export function CodeInput({ value, onChange }) {
  return (
    <div>
      <label className="label" htmlFor="code">6-digit code</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required
        className="input text-center text-2xl font-bold tracking-[0.6em]" placeholder="------"
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} />
    </div>
  );
}

export function ResendButton({ email, purpose }) {
  const [wait, setWait] = useState(60);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const resend = async () => {
    setNote('');
    try {
      await api.post('/auth/resend-code', { email, purpose });
      setNote('A new code is on its way.');
      setWait(60);
    } catch (err) {
      setNote(errorText(err));
    }
  };
  return (
    <p className="text-center text-sm text-slate-500">
      {note && <span className="mb-1 block">{note}</span>}
      No email? Check spam, or{' '}
      <button type="button" onClick={resend} disabled={wait > 0} className="font-semibold text-indigo-600 underline disabled:text-slate-400 disabled:no-underline">
        {wait > 0 ? `send a new code in ${wait}s` : 'send a new code'}
      </button>
    </p>
  );
}

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (code.length !== 6) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/auth/verify-email', { email, code });
      const me = await loginWithToken(r.data.access_token);
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Confirm your email" subtitle={`We sent a 6-digit code to ${email || 'your email'}. It works for 10 minutes.`}
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <CodeInput value={code} onChange={setCode} />
        <Button type="submit" loading={busy} className="w-full" size="lg">Confirm email</Button>
        {email && <ResendButton email={email} purpose="verify" />}
      </form>
    </AuthShell>
  );
}
