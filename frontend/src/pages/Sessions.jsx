import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import { Card, CardHeader, Empty, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/hooks';
import { dateTime, toDate } from '../lib/format';

export default function Sessions() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/sessions');
  const [now] = useState(() => Date.now());
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const upcoming = data.filter((s) => toDate(s.start_time).getTime() >= now);
  const past = data.filter((s) => toDate(s.start_time).getTime() < now).reverse();

  const list = (rows, isPast) => (
    <ul className="divide-y divide-slate-100">
      {rows.map((s) => (
        <li key={s.id}>
          <Link to={`/groups/${s.group_id}?tab=sessions`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <span className="text-[10px] font-semibold uppercase">{toDate(s.start_time).toLocaleDateString(undefined, { month: 'short' })}</span>
              <span className="text-lg font-bold leading-none">{toDate(s.start_time).getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{s.title}</p>
              <p className="text-sm text-slate-500">{dateTime(s.start_time)} · {s.duration_minutes} min · {s.group_name}</p>
              {s.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{s.location}</p>}
            </div>
            {isPast && <span className={s.attendees.includes(user.id) ? 'text-sm font-semibold text-emerald-700' : 'text-sm text-slate-500'}>
              {s.attendees.includes(user.id) ? 'You attended' : 'Attendance not marked'}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sessions" subtitle="Study sessions in your groups. Plan new ones from a group page." />
      <Card>
        <CardHeader title="Upcoming" icon={CalendarDays} />
        {upcoming.length ? list(upcoming, false) : <Empty title="No upcoming sessions">Open one of your groups and press "Plan a session".</Empty>}
      </Card>
      <Card>
        <CardHeader title="Last 30 days" />
        {past.length ? list(past, true) : <Empty title="No past sessions" />}
      </Card>
    </div>
  );
}
