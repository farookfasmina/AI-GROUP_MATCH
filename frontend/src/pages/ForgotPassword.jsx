import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api, { errorText } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link that works for 15 minutes."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      {sent ? (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p>If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox and spam folder.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <ErrorBox>{error}</ErrorBox>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required className="input" placeholder="you@university.lk" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" loading={busy} className="w-full" size="lg">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
