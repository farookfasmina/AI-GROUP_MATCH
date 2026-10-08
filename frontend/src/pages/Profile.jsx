import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Save, ShieldCheck, ShieldOff } from 'lucide-react';
import api, { errorText } from '../api';
import { Button, Card, CardHeader, ErrorBox, Modal, PageHeader, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { dateOnly } from '../lib/format';

export default function Profile() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ full_name: user.full_name || '', university: user.university || '', department: user.department || '', academic_year: user.academic_year || '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [busy, setBusy] = useState(null);
  const [withdraw, setWithdraw] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy('profile');
    setError('');
    try {
      await api.put('/users/me', form);
      await refresh();
      toast('Profile saved');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };
  const changePw = async (e) => {
    e.preventDefault();
    setBusy('pw');
    setPwError('');
    try {
      await api.post('/users/me/password', pw);
      setPw({ current_password: '', new_password: '' });
      toast('Password changed');
    } catch (err) {
      setPwError(errorText(err));
    } finally {
      setBusy(null);
    }
  };
  const doWithdraw = async () => {
    try {
      await api.delete('/users/me/consent');
      await refresh();
      toast('Consent withdrawn - you will not be matched again');
      navigate('/onboarding');
    } catch (err) {
      toast(errorText(err), 'error');
    }
  };
  const field = (k, label, props = {}) => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} className="input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...props} /></div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Profile" subtitle={user.email} />
      <Card>
        <CardHeader title="Your details" />
        <form onSubmit={save} className="space-y-4 p-5">
          <ErrorBox>{error}</ErrorBox>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('full_name', 'Full name', { required: true })}
            {field('university', 'University')}
            {field('department', 'Degree programme')}
            {field('academic_year', 'Year of study')}
          </div>
          <Button type="submit" loading={busy === 'profile'} icon={Save}>Save</Button>
        </form>
      </Card>
      <Card>
        <CardHeader title="Change password" icon={KeyRound} />
        <form onSubmit={changePw} className="space-y-4 p-5">
          <ErrorBox>{pwError}</ErrorBox>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="cp">Current password</label><input id="cp" type="password" required className="input" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></div>
            <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" required minLength={8} className="input" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></div>
          </div>
          <Button type="submit" variant="secondary" loading={busy === 'pw'}>Change password</Button>
        </form>
      </Card>
      {!user.is_platform_admin && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          {user.consent_given ? <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" /> : <ShieldOff className="h-6 w-6 shrink-0 text-slate-400" />}
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Research consent</p>
            <p className="text-sm text-slate-500">{user.consent_given ? `You agreed on ${dateOnly(user.consent_at)}.` : 'Not given.'} You can withdraw at any time without penalty - you will no longer be matched.</p>
          </div>
          {user.consent_given && <Button variant="secondary" onClick={() => setWithdraw(true)}>Withdraw</Button>}
        </Card>
      )}
      <Modal open={withdraw} onClose={() => setWithdraw(false)} title="Withdraw from the study?"
        footer={<><Button variant="secondary" onClick={() => setWithdraw(false)}>Keep taking part</Button><Button variant="danger" onClick={doWithdraw}>Withdraw</Button></>}>
        <p className="text-sm text-slate-600">You will not be included in new matching and you will not appear in other students' matches. Groups you already joined stay until you leave them. You can join again later.</p>
      </Modal>
    </div>
  );
}
