import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api, { errorText } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { AuthShell } from './Login';
import { CodeInput, ResendButton } from './VerifyEmail';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return setError('Enter the 6-digit code from the email.');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { email, code, new_password: password });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle={email ? `We sent a 6-digit code to ${email}.` : undefined}
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      {done ? (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>Your password was changed. <Link to="/login" className="font-semibold underline">Sign in</Link> with the new one.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox>{error}</ErrorBox>
          {!params.get('email') && (
            <div>
              <label className="label" htmlFor="em">Email</label>
              <input id="em" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}
          <CodeInput value={code} onChange={setCode} />
          <div>
            <label className="label" htmlFor="pw">New password</label>
            <input id="pw" type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="pw2">Confirm new password</label>
            <input id="pw2" type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <Button type="submit" loading={busy} className="w-full" size="lg">Save new password</Button>
          {email && <ResendButton email={email} purpose="reset" />}
        </form>
      )}
    </AuthShell>
  );
}
