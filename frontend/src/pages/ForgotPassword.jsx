import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a 6-digit code that works for 10 minutes."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" className="input" placeholder="you@university.lk" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">Send me a code</Button>
      </form>
    </AuthShell>
  );
}
