import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock, ChevronRight, ClipboardCheck, Lightbulb, MoreHorizontal, Settings2, Sparkles, Star, UsersRound, Video } from 'lucide-react';
import api, { errorText } from '../api';
import InvitationCard from '../components/InvitationCard';
import { Avatar, AvatarStack, Badge, Button, Card, ErrorBox, IconButton, ScoreRing, Spinner, Tile, cx, tileColor, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { BLOCKS, DAYS, toDate } from '../lib/format';

// --- helpers ----------------------------------------------------------------------------------

const START_H = 8;
const END_H = 22;

function hours(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h + (m || 0) / 60 || (h === 0 ? 24 : 0);
}

function weekStart(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); // Monday
  return s;
}

function subjectInitials(text = '') {
  return text.split(/[\s&-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

// --- panels -------------------------------------------------------------------------------------

function MatchPanel({ groups, nextSession, onFind, finding }) {
  const scored = groups.filter((g) => g.match_score != null);
  const avg = scored.length ? scored.reduce((a, g) => a + g.match_score, 0) / scored.length / 100 : 0;
  return (
    <Card className="flex h-full flex-col p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Match strength</h2>
        <Link to="/matches" aria-label="See my matches" className="rounded-full p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="relative">
          <ScoreRing score={avg} size={250} stroke={18} label={scored.length ? `across ${scored.length} AI group${scored.length > 1 ? 's' : ''}` : 'no AI groups yet'} />
          {nextSession && (
            <span className="absolute left-1/2 top-[22%] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-500">
              <Bell className="h-4 w-4" />
              {toDate(nextSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Link to="/matches"><Button variant="secondary" size="lg" className="whitespace-nowrap">Matches</Button></Link>
        <Button size="lg" onClick={onFind} loading={finding} icon={Sparkles} className="whitespace-nowrap">Find a group</Button>
      </div>
    </Card>
  );
}

function WeekPanel({ availability, sessions }) {
  const [now] = useState(() => new Date());
  const start = weekStart(now);
  const days = DAYS.map((name, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return { name, date };
  });
  const span = END_H - START_H;
  const pos = (from, to) => ({
    top: `${((Math.max(from, START_H) - START_H) / span) * 100}%`,
    height: `${((Math.min(to, END_H) - Math.max(from, START_H)) / span) * 100}%`,
  });
  const nowH = now.getHours() + now.getMinutes() / 60;
  const todayIdx = (now.getDay() + 6) % 7;
  const labels = [];
  for (let h = START_H; h <= END_H; h += 2) labels.push(h);

  return (
    <Card className="h-full p-4 sm:p-6">
      <div className="mb-2 flex items-center justify-between px-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">My week</h2>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-indigo-100 ring-1 ring-indigo-200" /> Free time</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gradient-to-br from-[#f99be6] to-[#ee6fd4]" /> Session</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <div className="grid min-w-[560px] grid-cols-[3rem_repeat(7,minmax(0,1fr))] pb-4">
          <div />
          {days.map((d, i) => (
            <div key={d.name} className={cx('rounded-t-2xl pb-3 pt-1 text-center', i === todayIdx && 'bg-slate-100/80')}>
              <p className={cx('text-sm', i === todayIdx ? 'font-bold text-slate-900' : 'text-slate-500')}>
                <span className="2xl:hidden">{d.name.slice(0, 3)}</span><span className="hidden 2xl:inline">{d.name}</span>
              </p>
              <p className={cx('text-xs', i === todayIdx ? 'font-semibold text-slate-700' : 'text-slate-400')}>
                {d.date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
              </p>
            </div>
          ))}
          {/* time axis */}
          <div className="relative h-[420px]">
            {labels.map((h) => (
              <span key={h} className="absolute -translate-y-1/2 text-xs font-semibold text-slate-500" style={{ top: `${((h - START_H) / span) * 100}%` }}>
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          {days.map((d, i) => {
            const free = availability.filter((a) => a.day_of_week === d.name);
            const todays = sessions.filter((s) => toDate(s.start_time).toDateString() === d.date.toDateString());
            return (
              <div key={d.name} className={cx('relative h-[420px] border-l border-slate-100', i === todayIdx && 'bg-slate-100/80 rounded-b-2xl')}>
                {free.map((a) => (
                  <div key={a.id} className="absolute inset-x-1.5 rounded-2xl bg-indigo-100/70 ring-1 ring-inset ring-indigo-200"
                    style={pos(hours(a.start_time), hours(a.end_time))} title={`Free ${a.start_time.slice(0, 5)}-${a.end_time.slice(0, 5)}`} />
                ))}
                {todays.map((s, k) => {
                  const t = toDate(s.start_time);
                  const from = t.getHours() + t.getMinutes() / 60;
                  const c = tileColor(s.group_id + k);
                  return (
                    <Link key={s.id} to={`/groups/${s.group_id}?tab=sessions`} style={pos(from, from + Math.max(s.duration_minutes, 60) / 60)}
                      className={cx('absolute inset-x-1 overflow-hidden rounded-2xl p-2 text-white shadow-md', c.tile)} title={`${s.title} - ${s.group_name}`}>
                      <Video className="h-3.5 w-3.5" />
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-tight">{s.title}</p>
                    </Link>
                  );
                })}
                {i === todayIdx && nowH >= START_H && nowH <= END_H && (
                  <div className="absolute inset-x-0 z-10 h-0.5 bg-indigo-500" style={{ top: `${((nowH - START_H) / span) * 100}%` }}>
                    <span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-indigo-500 ring-2 ring-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function BoardColumn({ title, groups, empty }) {
  return (
    <div className="flex min-w-[220px] flex-1 flex-col rounded-3xl bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{groups.length}</span>
      </div>
      {groups.length === 0 ? <p className="py-4 text-sm text-slate-400">{empty}</p> : (
        <ul className="space-y-3">
          {groups.slice(0, 4).map((g) => (
            <li key={g.id}>
              <Link to={`/groups/${g.id}`} className="flex items-center gap-3 rounded-2xl p-1 hover:bg-white">
                <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', tileColor(g.id).tile)}>
                  {subjectInitials(g.subject)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{g.name}</span>
                {g.my_feedback && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FreeTimePanel({ availability, sessions }) {
  const byDay = DAYS.map((day) => {
    const parts = BLOCKS.map((b) => {
      const total = availability.filter((a) => a.day_of_week === day).reduce((sum, a) => {
        const from = Math.max(hours(a.start_time), hours(b.start));
        const to = Math.min(hours(a.end_time), hours(b.end));
        return sum + Math.max(0, to - from);
      }, 0);
      return { key: b.key, label: b.label, hours: total };
    });
    return { day, parts, total: parts.reduce((a, p) => a + p.hours, 0) };
  });
  const total = byDay.reduce((a, d) => a + d.total, 0);
  const max = Math.max(...byDay.map((d) => d.total), 1);
  const colors = { morning: 'bg-gradient-to-r from-[#fcd34d] to-[#fb923c]', afternoon: 'bg-gradient-to-r from-[#f472b6] to-[#f43f5e]',
    evening: 'bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6]', night: 'bg-gradient-to-r from-[#60a5fa] to-[#3b82f6]' };
  return (
    <Card className="h-full p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Free time a week</p>
          <p className="text-3xl font-extrabold tracking-tight text-slate-900">{Math.round(total)}h</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500">Sessions this week</p>
          <p className="text-3xl font-extrabold tracking-tight text-slate-900">{sessions.length}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {byDay.map((d) => (
          <div key={d.day} className="flex items-center gap-3" title={`${d.day}: ${d.total}h free`}>
            <span className="w-4 text-xs font-bold text-slate-400">{d.day[0]}</span>
            <div className="flex h-7 flex-1 items-center">
              {d.total === 0 ? <span className="text-xs text-slate-300">-</span> : (
                <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${(d.total / max) * 100}%` }}>
                  {d.parts.filter((p) => p.hours > 0).map((p) => (
                    <div key={p.key} className={colors[p.key]} style={{ width: `${(p.hours / d.total) * 100}%` }} title={`${p.label}: ${p.hours}h`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        {BLOCKS.map((b) => <span key={b.key} className="inline-flex items-center gap-1.5"><span className={cx('h-2.5 w-2.5 rounded-full', colors[b.key])} />{b.label}</span>)}
      </div>
      <Link to="/preferences" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">Change free time <ChevronRight className="h-4 w-4" /></Link>
    </Card>
  );
}

function StudyTip() {
  const [tips, setTips] = useState(null);
  useEffect(() => {
    api.get('/ai/insights').then((r) => setTips(r.data)).catch(() => setTips([]));
  }, []);
  const challenge = tips?.find((t) => t.type === 'challenge');
  if (!challenge) return null;
  return (
    <Tile color={3} className="h-full">
      <div className="flex items-center gap-2"><Lightbulb className="h-5 w-5" /><Badge tone="white">Study tip of the day</Badge></div>
      <p className="mt-3 text-xl font-bold leading-snug">{challenge.title}</p>
      <p className="mt-1 text-sm text-white/90">{challenge.content}</p>
    </Tile>
  );
}

// --- page --------------------------------------------------------------------------------------------

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [finding, setFinding] = useState(false);
  const [unread, setUnread] = useState(0);

  const load = () =>
    Promise.all([api.get('/groups/me'), api.get('/sessions'), api.get('/availability'), api.get('/users/me/survey'), api.get('/notifications/unread-count')])
      .then(([g, s, a, sv, n]) => {
        setData({ groups: g.data, sessions: s.data, availability: a.data, survey: sv.data });
        setUnread(n.data.count);
      })
      .catch((e) => setError(errorText(e)));
  useEffect(() => {
    load();
  }, []);

  if (error) return <ErrorBox onRetry={load}>{error}</ErrorBox>;
  if (!data) return <Spinner />;

  const invites = data.groups.filter((g) => g.status === 'proposed' && g.my_status === 'pending');
  const waiting = data.groups.filter((g) => g.status === 'proposed' && g.my_status === 'accepted');
  const active = data.groups.filter((g) => g.status === 'active' && g.my_status === 'accepted');
  const closed = data.groups.filter((g) => g.status === 'closed');
  const start = weekStart();
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const thisWeek = data.sessions.filter((s) => toDate(s.start_time) >= start && toDate(s.start_time) < end);
  const upcoming = data.sessions.filter((s) => toDate(s.start_time) >= new Date());

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-indigo-900/70">Welcome back</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{user.full_name?.split(' ')[0] || 'there'}'s study space</h1>
        </div>
      </div>

      {invites.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Sparkles className="h-5 w-5 text-indigo-600" /> New matches for you</h2>
          <div className="grid gap-4 xl:grid-cols-2">{invites.map((g) => <InvitationCard key={g.id} group={g} onDone={load} />)}</div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] [&>*]:min-w-0">
        <MatchPanel groups={active.concat(waiting)} nextSession={upcoming[0]} onFind={findNow} finding={finding} />
        <WeekPanel availability={data.availability} sessions={thisWeek} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card className="self-start overflow-hidden p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">My groups</h2>
            <div className="flex gap-2">
              <Link to="/preferences"><IconButton icon={Settings2} label="Preferences" /></Link>
              <Link to="/survey"><IconButton icon={ClipboardCheck} label="Platform survey" dot={!data.survey} /></Link>
              <Link to="/notifications"><IconButton icon={Bell} label="Notifications" dot={unread > 0} /></Link>
            </div>
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            <BoardColumn title="Invitations" groups={invites.concat(waiting)} empty="No invitations right now" />
            <BoardColumn title="Active" groups={active} empty="Accept an invitation to start" />
            <BoardColumn title="Closed" groups={closed} empty="Nothing closed" />
          </div>
          {active.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {active.slice(0, 6).map((g) => (
                <Tile key={g.id} as={Link} to={`/groups/${g.id}`} color={g.id} progress={(g.match_score ?? 70) / 100} className="transition hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <AvatarStack people={g.people || []} ring={tileColor(g.id).ring} />
                    {g.kind === 'buddy' ? <Badge tone="white">Buddy</Badge> : <Badge tone="white">{g.member_count} members</Badge>}
                  </div>
                  <p className="mt-3 text-lg font-bold leading-tight">{g.subject}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-white/90">{g.meeting_slot || g.name}</p>
                </Tile>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-3xl bg-slate-50 py-8 text-center">
              <UsersRound className="h-8 w-8 text-indigo-300" />
              <p className="text-sm text-slate-500">No active groups yet. Accept an invitation or let the AI find one.</p>
              <Button onClick={findNow} loading={finding} icon={Sparkles}>Find a group</Button>
            </div>
          )}
        </Card>
        <div className="grid gap-6">
          <FreeTimePanel availability={data.availability} sessions={thisWeek} />
          <StudyTip />
          {!data.survey && (
            <Card className="flex items-center gap-4 p-5">
              <Avatar name="S U" id={2} />
              <div className="flex-1">
                <p className="font-bold text-slate-900">Help evaluate StudyMatch</p>
                <p className="text-sm text-slate-500">2-minute survey for the research.</p>
              </div>
              <Link to="/survey"><Button size="sm">Start</Button></Link>
            </Card>
          )}
          {upcoming.length > 0 && (
            <Card className="p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarClock className="h-4 w-4" /> Next session</p>
              <Link to={`/groups/${upcoming[0].group_id}?tab=sessions`} className="mt-2 block">
                <p className="font-bold text-slate-900">{upcoming[0].title}</p>
                <p className="text-sm text-slate-500">{toDate(upcoming[0].start_time).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })} · {upcoming[0].group_name}</p>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
