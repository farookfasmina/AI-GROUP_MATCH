import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, CheckCircle2, Clock, FileText, Loader2, LogOut, Mail, MapPin, Paperclip, Send, Sparkles, Trash2 } from 'lucide-react';
import api, { errorText } from '../api';
import { Avatar, Badge, Button, Card, CardHeader, Empty, ErrorBox, Modal, ScoreRing, Spinner, StatusBadge, Tabs, cx, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApi, useInterval } from '../lib/hooks';
import { LEVEL_TONE, dateTime, optionLabel, timeAgo, toDate } from '../lib/format';
import { FeedbackModal } from './Matches';

const KIND = { manual: 'Open group', ai_group: 'AI study group', buddy: 'Study buddies' };

function Overview({ g }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader title="Members" subtitle={`${g.member_count} members`} />
        <ul className="divide-y divide-slate-100">
          {g.members.filter((m) => m.status !== 'declined').map((m) => (
            <li key={m.id} className="flex items-start gap-3 px-5 py-4">
              <Avatar name={m.full_name} id={m.id} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{m.full_name}</p>
                  {m.role === 'admin' && <Badge tone="violet">Admin</Badge>}
                  {m.status === 'pending' && <StatusBadge status="pending" />}
                </div>
                <p className="text-sm text-slate-500">{m.department}{m.academic_year ? ` · ${m.academic_year}` : ''}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.competency && <Badge tone={LEVEL_TONE[m.competency]}>{m.competency}</Badge>}
                  {m.collaboration_tendency && <Badge>{optionLabel('collaboration_tendency', m.collaboration_tendency)}</Badge>}
                  {m.learning_style && <Badge>{optionLabel('learning_style', m.learning_style)}</Badge>}
                  {m.communication_preference && <Badge tone="sky">{optionLabel('communication_preference', m.communication_preference)}</Badge>}
                </div>
                {m.email && <a href={`mailto:${m.email}`} className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"><Mail className="h-3.5 w-3.5" />{m.email}</a>}
              </div>
            </li>
          ))}
        </ul>
        {g.status === 'proposed' && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Emails are shown once everyone has accepted.</p>}
      </Card>
      <div className="space-y-6 lg:col-span-2">
        {g.reasons?.length > 0 && (
          <Card>
            <CardHeader title="Why you were matched" icon={Sparkles} />
            <ul className="space-y-2 px-5 py-4 text-sm text-slate-700">
              {g.reasons.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{r}</li>)}
            </ul>
          </Card>
        )}
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">About this group</p>
          <p className="mt-1 text-sm text-slate-600">{g.description || 'No description.'}</p>
          {g.meeting_slot && <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-700"><Clock className="h-4 w-4 text-brand-600" />Everyone is free: <b>{g.meeting_slot}</b></p>}
        </Card>
      </div>
    </div>
  );
}

function Chat({ g, canPost }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const bottom = useRef(null);
  const fileRef = useRef(null);
  const last = msgs.length ? msgs[msgs.length - 1].id : 0;

  const load = async (after) => {
    try {
      const r = await api.get(`/groups/${g.id}/messages`, { params: { after } });
      if (r.data.length) setMsgs((m) => (after ? [...m, ...r.data.filter((x) => !m.some((y) => y.id === x.id))] : r.data));
    } catch (e) {
      setError(errorText(e));
    }
  };
  useEffect(() => {
    load(0);
    api.put('/notifications/read-all', null, { params: { link: `/groups/${g.id}` } })
      .then(() => window.dispatchEvent(new Event('sm:notifications'))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.id]);
  useInterval(() => load(last), 4000);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await api.post(`/groups/${g.id}/messages`, { content: text });
      setMsgs((m) => (m.some((x) => x.id === r.data.id) ? m : [...m, r.data]));
      setText('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post(`/groups/${g.id}/upload`, fd);
      setMsgs((m) => [...m, r.data]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="flex h-[34rem] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
        {msgs.length === 0 && <Empty title="No messages yet">Say hello and suggest a time for your first session.</Empty>}
        {msgs.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
              {!mine && <Avatar name={m.sender_name} id={m.sender_id} size="sm" />}
              <div className={cx('max-w-[80%] rounded-2xl px-4 py-2.5', mine ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800')}>
                {!mine && <p className="mb-0.5 text-xs font-semibold text-slate-500">{m.sender_name}</p>}
                {m.is_file ? (
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" className={cx('flex items-center gap-2 text-sm font-medium underline', mine ? 'text-white' : 'text-brand-700')}>
                    <FileText className="h-4 w-4 shrink-0" />{m.file_name}
                  </a>
                ) : <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>}
                <p className={cx('mt-1 text-[11px]', mine ? 'text-brand-200' : 'text-slate-400')}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error && <div className="px-5 pb-2"><ErrorBox>{error}</ErrorBox></div>}
      {canPost ? (
        <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
          <input type="file" ref={fileRef} className="hidden" onChange={upload} accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-50" aria-label="Share a file" title="Share a file (max 10 MB)">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <input className="input" placeholder="Write a message..." value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} aria-label="Message" />
          <Button type="submit" loading={busy} icon={Send}>Send</Button>
        </form>
      ) : (
        <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">{g.status === 'closed' ? 'This group is closed.' : 'Accept the invitation to join the chat.'}</p>
      )}
    </Card>
  );
}

function Sessions({ g, canPost, reload }) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: `${g.subject} study session`, start_time: '', duration_minutes: 60, location: '' });
  const [now] = useState(() => Date.now());
  const upcoming = g.sessions.filter((s) => toDate(s.start_time).getTime() >= now);
  const past = g.sessions.filter((s) => toDate(s.start_time).getTime() < now).reverse();

  const save = async () => {
    if (!form.start_time) return setError('Choose a date and time.');
    if (new Date(form.start_time).getTime() <= Date.now()) return setError('Choose a time in the future.');
    setBusy(true);
    setError('');
    try {
      await api.post(`/groups/${g.id}/sessions`, { ...form, start_time: new Date(form.start_time).toISOString(), duration_minutes: Number(form.duration_minutes) });
      toast('Session planned - members were notified');
      setOpen(false);
      reload();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const act = async (fn, okText) => {
    try {
      await fn();
      if (okText) toast(okText);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  const row = (s, isPast) => {
    const here = s.attendees.includes(user.id);
    return (
      <li key={s.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{s.title}</p>
          <p className="text-sm text-slate-500">{dateTime(s.start_time)} · {s.duration_minutes} min</p>
          {s.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{s.location}</p>}
        </div>
        {isPast && <span className="text-sm text-slate-500">{s.attendees.length}/{g.member_count} attended</span>}
        {isPast && canPost && (
          <Button size="sm" variant={here ? 'success' : 'secondary'} icon={here ? CheckCircle2 : undefined}
            onClick={() => act(() => api.post(`/groups/${g.id}/sessions/${s.id}/attend`))}>{here ? 'I attended' : 'Mark attended'}</Button>
        )}
        {!isPast && canPost && s.created_by === user.id && (
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => act(() => api.delete(`/groups/${g.id}/sessions/${s.id}`), 'Session cancelled')}>Cancel</Button>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Upcoming" icon={CalendarPlus} action={canPost && <Button size="sm" onClick={() => setOpen(true)} icon={CalendarPlus}>Plan a session</Button>} />
        {upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.map((s) => row(s, false))}</ul>
          : <Empty title="No upcoming sessions">{g.meeting_slot ? `Everyone is free: ${g.meeting_slot}.` : ''}</Empty>}
      </Card>
      <Card>
        <CardHeader title="Past sessions" subtitle="Mark your attendance - it is part of the research evaluation" />
        {past.length ? <ul className="divide-y divide-slate-100">{past.map((s) => row(s, true))}</ul> : <Empty title="No past sessions yet" />}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Plan a study session"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} loading={busy}>Save session</Button></>}>
        <div className="space-y-4">
          <ErrorBox>{error}</ErrorBox>
          <div><label className="label" htmlFor="st">Title</label><input id="st" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="sd">Date and time</label><input id="sd" type="datetime-local" className="input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
            <div><label className="label" htmlFor="sdur">Length</label>
              <select id="sdur" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}>
                {[30, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
          </div>
          <div><label className="label" htmlFor="sl">Place or meeting link</label><input id="sl" className="input" placeholder="Library room 2, or a Google Meet link" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          {g.meeting_slot && <p className="text-xs text-slate-500">Everyone is free: {g.meeting_slot}</p>}
        </div>
      </Modal>
    </div>
  );
}

export default function GroupDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const { data: g, error, loading, reload } = useApi(`/groups/${id}`);
  const [busy, setBusy] = useState(null);
  const [rate, setRate] = useState(params.get('tab') === 'feedback');
  const [leaving, setLeaving] = useState(false);
  const tab = ['chat', 'sessions'].includes(params.get('tab')) ? params.get('tab') : 'overview';

  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const accepted = g.my_status === 'accepted';
  const canPost = accepted && g.status !== 'closed';
  const back = user.is_platform_admin && !g.my_status ? '/admin/groups' : '/groups';

  const respond = async (accept) => {
    setBusy(accept ? 'yes' : 'no');
    try {
      await api.post(`/groups/${g.id}/respond`, { accept });
      toast(accept ? 'You joined the group' : 'Invitation declined');
      window.dispatchEvent(new Event('sm:notifications'));
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const leave = async () => {
    try {
      await api.post(`/groups/${g.id}/leave`);
      toast('You left the group');
      setLeaving(false);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Link to={back} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Back to groups</Link>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {g.match_score != null && <ScoreRing score={g.match_score / 100} size={80} />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2"><StatusBadge status={g.status} /><Badge tone="brand">{KIND[g.kind] || 'Group'}</Badge></div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{g.name}</h1>
            <p className="text-slate-500">{g.subject}{g.avg_rating ? ` · rated ${g.avg_rating} / 5` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {g.my_status === 'pending' && g.status === 'proposed' && (
              <>
                <Button onClick={() => respond(true)} loading={busy === 'yes'} disabled={!!busy}>Accept</Button>
                <Button variant="secondary" onClick={() => respond(false)} loading={busy === 'no'} disabled={!!busy}>Decline</Button>
              </>
            )}
            {canPost && g.status === 'active' && (
              <Button variant="secondary" onClick={() => setRate(true)}>{g.feedback ? 'Update my rating' : 'Rate this group'}</Button>
            )}
            {canPost && <Button variant="ghost" icon={LogOut} onClick={() => setLeaving(true)}>Leave</Button>}
          </div>
        </div>
      </Card>
      <Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'chat', label: 'Chat' }, { value: 'sessions', label: `Sessions (${g.sessions.length})` }]}
        value={tab} onChange={(v) => setParams(v === 'overview' ? {} : { tab: v })} />
      {tab === 'overview' && <Overview g={g} />}
      {tab === 'chat' && <Chat g={g} canPost={canPost} />}
      {tab === 'sessions' && <Sessions g={g} canPost={canPost} reload={reload} />}
      {rate && canPost && (
        <FeedbackModal open onClose={() => setRate(false)} title={`Rate ${g.name}`} endpoint={`/groups/${g.id}/feedback`} withContinue
          initial={g.feedback || undefined} onSaved={reload} subtitle="Answers are private. They retrain the matching model." />
      )}
      <Modal open={leaving} onClose={() => setLeaving(false)} title={`Leave ${g.name}?`}
        footer={<><Button variant="secondary" onClick={() => setLeaving(false)}>Stay</Button><Button variant="danger" onClick={leave}>Leave group</Button></>}>
        <p className="text-sm text-slate-600">The other members are told. For AI groups and buddy pairs you go back into the matching pool for this subject.</p>
      </Modal>
    </div>
  );
}
