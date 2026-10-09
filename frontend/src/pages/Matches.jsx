import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Info, MessageSquare, Star, UserPlus } from 'lucide-react';
import api, { errorText } from '../api';
import { Meter } from '../components/charts';
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader, ScoreRing, Spinner, StarInput, useToast } from '../components/ui';
import { useApi } from '../lib/hooks';
import { optionLabel } from '../lib/format';

// Proposal factors: fits / partly fits / does not fit
const STATUS = {
  match: { dot: 'bg-emerald-600', icon: '✓', label: 'Fits' },
  partial: { dot: 'bg-amber-600', icon: '~', label: 'Partly fits' },
  miss: { dot: 'bg-rose-600', icon: '✕', label: 'Does not fit' },
};

const FACTOR_LABELS = {
  subject_overlap: 'Shared subjects', availability_overlap: 'Shared free time', study_type_match: 'Study type',
  collab_tendency_match: 'Collaboration style', learning_style_match: 'Learning style',
  comm_pref_match: 'Communication', competency_match: 'Competency balance',
};

export function FeedbackModal({ open, onClose, title, subtitle, endpoint, withContinue, initial, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(initial || { compatibility_rating: 0, collaboration_quality: 0, scheduling_ease: 0, feedback_text: '', would_continue: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (!f.compatibility_rating || !f.collaboration_quality || !f.scheduling_ease) return setError('Please rate all three questions.');
    setBusy(true);
    setError('');
    try {
      const body = { ...f, feedback_text: f.feedback_text || null };
      if (!withContinue) delete body.would_continue;
      await api.post(endpoint, body);
      toast('Thank you - your feedback helps the AI match better');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy}>Submit</Button></>}>
      <div className="space-y-5">
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        <StarInput label="How well did your subjects and goals fit?" value={f.compatibility_rating} onChange={(v) => setF({ ...f, compatibility_rating: v })} />
        <StarInput label="How good was the collaboration?" value={f.collaboration_quality} onChange={(v) => setF({ ...f, collaboration_quality: v })} />
        <StarInput label="How easy was it to find times to meet?" value={f.scheduling_ease} onChange={(v) => setF({ ...f, scheduling_ease: v })} />
        {withContinue && (
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={f.would_continue} onChange={(e) => setF({ ...f, would_continue: e.target.checked })} />
            I would like to keep studying with this group
          </label>
        )}
        <div>
          <label className="label" htmlFor="fbt">Anything else? <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea id="fbt" rows={3} maxLength={1000} className="input" value={f.feedback_text || ''} onChange={(e) => setF({ ...f, feedback_text: e.target.value })} />
        </div>
        <ErrorBox>{error}</ErrorBox>
      </div>
    </Modal>
  );
}

function MatchCard({ m, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [why, setWhy] = useState(false);
  const [rate, setRate] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      await api.post(`/matches/${m.target_user_id}/connect`);
      toast(`Request sent to ${m.full_name}`);
      onChange();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-4">
        <Avatar name={m.full_name} id={m.target_user_id} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900">{m.full_name}</h3>
          <p className="truncate text-sm text-slate-500">{m.department}{m.academic_year ? ` · ${m.academic_year}` : ''}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.shared_subjects.slice(0, 3).map((s) => <Badge key={s} tone="brand">{s}</Badge>)}
            {m.competency_level && <Badge>{m.competency_level}</Badge>}
            {m.collaboration_tendency && <Badge>{optionLabel('collaboration_tendency', m.collaboration_tendency)}</Badge>}
          </div>
        </div>
        <ScoreRing score={m.compatibility_score / 100} size={60} />
      </div>
      <ul className="mt-4 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4" aria-label="Proposal matching factors">
        {(m.proposal || []).map((f) => (
          <li key={f.factor} className="flex items-start gap-3 py-2.5 text-sm">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${STATUS[f.status].dot}`} aria-label={STATUS[f.status].label}>{STATUS[f.status].icon}</span>
            <span className="w-32 shrink-0 font-semibold text-slate-800">{f.factor}</span>
            <span className="min-w-0 text-slate-600">{f.detail}</span>
          </li>
        ))}
      </ul>
      <button onClick={() => setWhy(!why)} className="mt-2 inline-flex items-center gap-1 self-start text-xs font-semibold text-brand-600 hover:underline">
        <Info className="h-3.5 w-3.5" /> {why ? 'Hide' : 'Show'} the score breakdown
      </button>
      {why && (
        <div className="mt-3 space-y-2">
          {Object.entries(m.factors).map(([k, v]) => (
            <div key={k}>
              <div className="mb-0.5 flex justify-between text-xs"><span className="text-slate-600">{FACTOR_LABELS[k]}</span><span className="font-semibold tabular-nums">{Math.round(v * 100)}%</span></div>
              <Meter value={v} />
            </div>
          ))}
          <p className="text-xs text-slate-500">KNN similarity {m.knn_similarity}% · {m.shared_hours} shared free hours a week</p>
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {m.partner_group_id ? (
          <>
            <Link to={`/groups/${m.partner_group_id}`}><Button size="sm" icon={MessageSquare}>Open chat</Button></Link>
            <Link to={`/groups/${m.partner_group_id}?tab=sessions`}><Button size="sm" variant="secondary" icon={CalendarClock}>Schedule</Button></Link>
          </>
        ) : m.requested ? (
          <Button size="sm" variant="success" icon={CheckCircle2} disabled>Request sent</Button>
        ) : (
          <Button size="sm" onClick={connect} loading={busy} icon={UserPlus}>Ask to study together</Button>
        )}
        {m.partner_group_id && (
          <Button size="sm" variant="ghost" icon={Star} onClick={() => setRate(true)}>{m.rated ? 'Update rating' : 'Rate partner'}</Button>
        )}
      </div>
      {rate && (
        <FeedbackModal open onClose={() => setRate(false)} title={`Rate ${m.full_name}`} endpoint={`/matches/${m.target_user_id}/feedback`} onSaved={onChange}
          subtitle="Your rating is private and trains the matching model." />
      )}
    </Card>
  );
}

export default function Matches() {
  const { data, error, loading, reload } = useApi('/matches/me');
  return (
    <div className="space-y-6">
      <PageHeader title="My top matches" subtitle="Students who share a subject with you, found by K-Nearest Neighbours and checked against the five factors in the proposal: subject, study type, availability, competency and social preferences." />
      {loading ? <Spinner label="Running the matching model" /> : error ? (
        <ErrorBox onRetry={reload}>{error} {error.includes('Preferences') && <Link className="font-semibold underline" to="/preferences">Open Preferences</Link>}</ErrorBox>
      ) : data.length === 0 ? (
        <Card><Empty icon={UserPlus} title="No matches yet">Not enough students have completed their profile. Add more subjects or free time to widen the search.</Empty></Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">{data.map((m) => <MatchCard key={m.target_user_id} m={m} onChange={reload} />)}</div>
      )}
    </div>
  );
}
