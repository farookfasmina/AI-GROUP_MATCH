import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CheckCheck, Info, MessageSquare, Sparkles, Trash2, UserPlus, UsersRound } from 'lucide-react';
import api, { errorText } from '../api';
import { Button, Card, Empty, ErrorBox, PageHeader, Spinner, cx, useToast } from '../components/ui';
import { useApi } from '../lib/hooks';
import { timeAgo } from '../lib/format';

const ICONS = { group_invite: Sparkles, match_request: UserPlus, group: UsersRound, session: CalendarClock, message: MessageSquare };
const TONES = { group_invite: 'bg-brand-50 text-brand-600', match_request: 'bg-amber-50 text-amber-600', group: 'bg-emerald-50 text-emerald-600',
  session: 'bg-sky-50 text-sky-600', message: 'bg-violet-50 text-violet-600' };

export default function Notifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi('/notifications');
  const [busy, setBusy] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const changed = () => window.dispatchEvent(new Event('sm:notifications'));
  const markAll = async () => {
    await api.put('/notifications/read-all');
    setData(data.map((n) => ({ ...n, is_read: true })));
    changed();
  };
  const clearAll = async () => {
    await api.delete('/notifications/clear-all');
    setData([]);
    changed();
  };
  const open = async (n) => {
    if (!n.is_read) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {});
      changed();
    }
    if (n.link && n.link !== '/notifications') navigate(n.link);
    else setData(data.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
  };
  const accept = async (n) => {
    setBusy(n.id);
    try {
      const r = await api.post(`/matches/${n.payload_id}/accept`);
      toast('Request accepted - your private group is ready');
      changed();
      navigate(`/groups/${r.data.group_id}`);
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const unread = data.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : 'You are all caught up'}
        action={data.length > 0 && <div className="flex gap-2">
          {unread > 0 && <Button variant="secondary" onClick={markAll} icon={CheckCheck}>Mark all read</Button>}
          <Button variant="ghost" onClick={clearAll} icon={Trash2}>Clear</Button>
        </div>} />
      <Card>
        {data.length === 0 ? <Empty icon={Bell} title="No notifications">You are notified here when you get a match or a message.</Empty> : (
          <ul className="divide-y divide-slate-100">
            {data.map((n) => {
              const Icon = ICONS[n.type] || Info;
              return (
                <li key={n.id} className={cx('flex items-start gap-4 px-5 py-4', !n.is_read && 'bg-brand-50/40')}>
                  <div className={cx('rounded-lg p-2', TONES[n.type] || 'bg-slate-100 text-slate-500')}><Icon className="h-4 w-4" /></div>
                  <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                    <p className={cx('text-sm', n.is_read ? 'text-slate-700' : 'font-semibold text-slate-900')}>{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                    {n.type === 'match_request' && !n.is_read && (
                      <span className="mt-2 inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" loading={busy === n.id} onClick={() => accept(n)}>Accept</Button>
                        <Button size="sm" variant="secondary" onClick={() => open(n)}>Ignore</Button>
                      </span>
                    )}
                  </button>
                  {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
