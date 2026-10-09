import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorText } from '../api';
import { Button, ErrorBox } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './Login';

const DEPARTMENTS = ['Information Technology', 'Software Engineering', 'Networking & Mobile Computing', 'Data Science', 'Other'];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', university: 'Horizon Campus', department: DEPARTMENTS[0], academic_year: 'Year 1', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.');
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const { confirm: _confirm, ...body } = form;
      const r = await api.post('/auth/register', body);
      if (r.data.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`, { replace: true });
        return;
      }
      await login(form.email, form.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Takes a minute. Next you will set up your study profile."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" required minLength={2} className="input" placeholder="e.g. Fathima Nizam" value={form.full_name} onChange={set('full_name')} autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">University email</label>
          <input id="email" type="email" required className="input" placeholder="you@university.lk" value={form.email} onChange={set('email')} autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="uni">University</label>
            <input id="uni" className="input" value={form.university} onChange={set('university')} />
          </div>
          <div>
            <label className="label" htmlFor="year">Year of study</label>
            <select id="year" className="input" value={form.academic_year} onChange={set('academic_year')}>
              {['Year 1', 'Year 2', 'Year 3', 'Year 4'].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="dep">Degree programme</label>
          <select id="dep" className="input" value={form.department} onChange={set('department')}>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" required minLength={8} className="input" placeholder="8+ characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" required className="input" placeholder="Type it again" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </div>
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">Create account</Button>
      </form>
    </AuthShell>
  );
}
