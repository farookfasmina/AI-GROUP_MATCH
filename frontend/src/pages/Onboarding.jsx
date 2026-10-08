import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';
import api, { errorText } from '../api';
import { Logo } from '../components/Layout';
import {
  AvailabilitySection, StyleSection, SubjectsSection, formToPref, keysToAvailability, prefToForm, validate,
} from '../components/ProfileForm';
import { Button, ErrorBox, Spinner, cx, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { optionLabel } from '../lib/format';

const STEPS = [
  { key: 'consent', label: 'Consent' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'style', label: 'Study style' },
  { key: 'availability', label: 'Free time' },
  { key: 'review', label: 'Review' },
];

export const CONSENT_POINTS = [
  'We collect your subjects, self-rated level, study type, free times and study style - only to form study groups.',
  'Group members see your name, programme and study style. Your email is shown only once a group is active.',
  'We never collect gender, ethnicity, religion or disability, and the AI never uses them.',
  'Your ratings and survey answers are used anonymously to evaluate and improve the matching.',
  'Taking part is voluntary. You can withdraw at any time from your Profile page, without any penalty.',
];

function Consent({ agreed, setAgreed }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p>StudyMatch AI is part of a university research project. Please read how your information is used.</p>
      </div>
      <ul className="space-y-3 text-sm text-slate-700">
        {CONSENT_POINTS.map((t) => <li key={t} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{t}</li>)}
      </ul>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-slate-200 p-4 hover:border-brand-300">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand-600" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span className="text-sm font-medium text-slate-800">I have read the above and agree to take part.</span>
      </label>
    </div>
  );
}

function Review({ form }) {
  const rows = [
    ['Subjects', form.subjects.map((s) => `${s} (${(form.subject_levels[s] || 'Intermediate').toLowerCase()})`).join(', ')],
    ['Study type', `${optionLabel('preferred_study_type', form.preferred_study_type)}${form.preferred_study_type !== 'Buddy' ? `, ${form.preferred_group_size} people` : ''}`],
    ['In a group', optionLabel('collaboration_tendency', form.collaboration_tendency)],
    ['Learning style', optionLabel('learning_style', form.learning_style)],
    ['Communication', optionLabel('communication_preference', form.communication_preference)],
    ['Free time', `${form.availability.size} time blocks a week`],
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <p>When you finish, the AI looks for the best study group or buddy for each subject straight away. You get a notification for every match.</p>
      </div>
      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
            <dt className="text-sm font-medium text-slate-500">{k}</dt>
            <dd className="text-sm text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [agreed, setAgreed] = useState(!!user?.consent_given);
  const [step, setStep] = useState(user?.consent_given ? 1 : 0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/preferences/me'), api.get('/availability'), api.get('/preferences/subjects')])
      .then(([p, a, s]) => {
        setForm(prefToForm(p.data, a.data));
        setCatalogue(s.data);
      })
      .catch((e) => setError(errorText(e)));
  }, []);

  if (!form) return <div className="min-h-screen bg-slate-50">{error ? <div className="p-8"><ErrorBox>{error}</ErrorBox></div> : <Spinner />}</div>;

  const set = (patch) => setForm((f) => ({ ...f, ...(typeof patch === 'function' ? patch(f) : patch) }));
  const current = STEPS[step].key;

  const next = async () => {
    setError('');
    if (current === 'consent') {
      if (!agreed) return setError('Please tick the consent box to continue.');
      try {
        await api.post('/users/me/consent');
      } catch (e) {
        return setError(errorText(e));
      }
    }
    const problem = validate(form, current);
    if (problem) return setError(problem);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function finish() {
    setBusy(true);
    setError('');
    try {
      await api.put('/preferences/me', formToPref(form));
      await api.post('/availability', keysToAvailability(form.availability));
      await refresh();
      const r = await api.post('/matches/find-group').catch(() => null);
      toast(r?.data?.message || 'Profile saved');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <span className="text-sm text-slate-500">Hi {user?.full_name?.split(' ')[0]}</span>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-700">Step {step + 1} of {STEPS.length}</span>
          <span className="text-slate-500">{STEPS[step].label}</span>
        </div>
        <div className="mb-8 flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => <div key={s.key} className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-brand-600' : 'bg-slate-200')} />)}
        </div>
        <div className="card p-5 sm:p-8">
          <h1 className="mb-6 text-xl font-bold text-slate-900">
            {current === 'consent' ? 'Before we start' : current === 'review' ? 'Check your answers' : 'Set up your study profile'}
          </h1>
          {current === 'consent' && <Consent agreed={agreed} setAgreed={setAgreed} />}
          {current === 'subjects' && <SubjectsSection form={form} set={set} catalogue={catalogue} />}
          {current === 'style' && <StyleSection form={form} set={set} />}
          {current === 'availability' && <AvailabilitySection form={form} set={set} />}
          {current === 'review' && <Review form={form} />}
          {error && <div className="mt-6"><ErrorBox>{error}</ErrorBox></div>}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => { setError(''); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} icon={ArrowLeft}>Back</Button>
            {current === 'review'
              ? <Button onClick={finish} loading={busy} icon={Sparkles} size="lg">Save and find my matches</Button>
              : <Button onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
