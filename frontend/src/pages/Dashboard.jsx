import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, Inbox, Lightbulb, MapPin, MessageSquareHeart, Sparkles, UserPlus, UsersRound } from 'lucide-react';
import api, { errorText } from '../api';
import InvitationCard from '../components/InvitationCard';
import { Badge, Button, Card, CardHeader, Empty, ErrorBox, PageHeader, ScoreRing, Spinner, Stat, StatusBadge, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { dateTime } from '../lib/format';

function StudyTip() {
  const [tips, setTips] = useState(null);
  useEffect(() => {
    api.get('/ai/insights').then((r) => setTips(r.data)).catch(() => setTips([]));
  }, []);
  if (!tips?.length) return null;
  const challenge = tips.find((t) => t.type === 'challenge');
  const resource = tips.find((t) => t.type === 'resource');
  return (
    <Card>
      <CardHeader title="Study tip of the day" subtitle="Picked for your subjects" icon={Lightbulb} />
      <div className="space-y-4 p-5 text-sm">
        {challenge && (<div><Badge tone="emerald">Challenge</Badge><p className="mt-2 font-semibold text-slate-900">{challenge.title}</p><p className="mt-1 text-slate-600">{challenge.content}</p></div>)}
        {resource && (<div><Badge tone="amber">Resource</Badge><p className="mt-2 font-semibold text-slate-900">{resource.title}</p><p className="mt-1 text-slate-600">{resource.content}</p></div>)}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [finding, setFinding] = useState(false);

  const load = () =>
    Promise.all([api.get('/groups/me'), api.get('/sessions/me'), api.get('/users/me/survey')])
      .then(([g, s, sv]) => setData({ groups: g.data, sessions: s.data, survey: sv.data }))
      .catch((e) => setError(errorText(e)));
  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorBox onRetry={load}>{error}</ErrorBox>;
  if (!data) return <Spinner />;

  const invites = data.groups.filter((g) => g.status === 'proposed' && g.my_status === 'pending');
  const active = data.groups.filter((g) => g.status === 'active' && g.my_status === 'accepted');
  const feedbackDue = active.filter((g) => g.kind !== 'manual' && !g.my_feedback);

  const findNow = async () => {
    setFinding(true);
    try {
      const r = await api.post('/matches/find-group');
      toast(r.data.message, r.data.found ? 'success' : 'error');
      load();
      window.dispatchEvent(new Event('sm:notifications'));
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setFinding(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome back, ${user.full_name?.split(' ')[0] || 'there'}`} subtitle="Your matches, groups and sessions at a glance."
        action={<Button onClick={findNow} loading={finding} icon={Sparkles}>Find me a study group</Button>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active groups" value={active.length} icon={UsersRound} />
        <Stat label="Invitations" value={invites.length} icon={Inbox} tone="amber" />
        <Stat label="Upcoming sessions" value={data.sessions.length} icon={CalendarClock} tone="sky" />
        <Link to="/matches" className="block"><Stat label="Study partners" value="Top 5" hint="See your KNN matches" icon={UserPlus} tone="emerald" /></Link>
      </div>

      {invites.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900"><Sparkles className="h-5 w-5 text-brand-600" /> New matches for you</h2>
          <div className="grid gap-4 xl:grid-cols-2">{invites.map((g) => <InvitationCard key={g.id} group={g} onDone={load} />)}</div>
        </section>
      )}

      {feedbackDue.length > 0 && (
        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center">
          <MessageSquareHeart className="h-6 w-6 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900">How is it going?</p>
            <p className="text-sm text-slate-600">Rate {feedbackDue.map((g) => g.name).join(', ')} - your answers teach the AI to match better.</p>
          </div>
          <Link to={`/groups/${feedbackDue[0].id}?tab=feedback`}><Button size="sm" variant="secondary">Give feedback</Button></Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="My groups" icon={UsersRound} action={<Link to="/groups" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>} />
          {active.length === 0 ? (
            <Empty icon={UsersRound} title="No active groups yet">Accept an invitation, or press "Find me a study group".</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {active.map((g) => (
                <li key={g.id}>
                  <Link to={`/groups/${g.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                    {g.match_score != null ? <ScoreRing score={g.match_score / 100} size={48} /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><UsersRound className="h-5 w-5 text-slate-400" /></div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{g.name}</p>
                      <p className="truncate text-sm text-slate-500">{g.member_count} members{g.meeting_slot ? ` · ${g.meeting_slot}` : ''}</p>
                    </div>
                    <StatusBadge status={g.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Upcoming sessions" icon={CalendarClock} />
          {data.sessions.length === 0 ? <Empty title="Nothing planned">Plan a session from your group page.</Empty> : (
            <ul className="divide-y divide-slate-100">
              {data.sessions.slice(0, 5).map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <Link to={`/groups/${s.group_id}?tab=sessions`} className="block">
                    <p className="font-medium text-slate-900">{s.title}</p>
                    <p className="text-sm text-slate-500">{dateTime(s.start_time)}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{s.location || 'Place not set'} · {s.group_name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StudyTip />
        {!data.survey && (
          <Card className="flex flex-col justify-center gap-3 p-6">
            <ClipboardCheck className="h-7 w-7 text-brand-600" />
            <p className="font-semibold text-slate-900">Help evaluate this platform</p>
            <p className="text-sm text-slate-600">A 2-minute survey on how fair, useful and easy StudyMatch is - part of the research.</p>
            <Link to="/survey"><Button size="sm" variant="soft">Take the survey</Button></Link>
          </Card>
        )}
      </div>
    </div>
  );
}
