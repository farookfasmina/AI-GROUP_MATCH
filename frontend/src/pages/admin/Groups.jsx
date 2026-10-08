import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, UsersRound } from 'lucide-react';
import api, { downloadFile, errorText } from '../../api';
import { Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader, ScoreRing, Spinner, StatusBadge, useToast } from '../../components/ui';
import { useApi } from '../../lib/hooks';
import { dateOnly } from '../../lib/format';

const KIND = { manual: 'Open', ai_group: 'AI group', buddy: 'Buddy pair' };

export default function AdminGroups() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/admin/groups');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [closing, setClosing] = useState(null);
  const rows = useMemo(() => (data || []).filter((g) => (status === 'all' || g.status === status)
    && (!q || `${g.name} ${g.subject} ${g.members.join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const close = async () => {
    try {
      await api.post(`/admin/groups/${closing.id}/close`);
      toast(`${closing.name} closed`);
      setClosing(null);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="All groups" subtitle={`${data.length} groups and buddy pairs`}
        action={<Button variant="secondary" icon={Download} onClick={() => downloadFile('/admin/export/groups', 'studymatch-groups.csv')}>Export CSV</Button>} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by group, subject or student" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search groups" />
        </div>
        <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option><option value="proposed">Waiting for answers</option><option value="active">Active</option><option value="closed">Closed</option>
        </select>
      </div>
      <Card>
        {rows.length === 0 ? <Empty icon={UsersRound} title="No groups found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Group</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Members</th><th className="px-3 py-3">Meets</th><th className="px-3 py-3">Activity</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Status</th><th className="px-3 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><Link to={`/groups/${g.id}`} className="font-semibold text-slate-900 hover:text-brand-700">{g.name}</Link>
                      <p className="text-xs text-slate-500"><Badge className="mr-1">{KIND[g.kind]}</Badge>{dateOnly(g.created_at)}</p></td>
                    <td className="px-3 py-3">{g.match_score != null ? <ScoreRing score={g.match_score / 100} size={44} /> : '-'}</td>
                    <td className="px-3 py-3"><p className="max-w-[15rem] truncate text-slate-700" title={g.members.join(', ')}>{g.members.join(', ')}</p></td>
                    <td className="px-3 py-3 text-slate-600">{g.meeting_slot || '-'}</td>
                    <td className="px-3 py-3 text-slate-600">{g.sessions} sessions · {g.messages} msgs</td>
                    <td className="px-3 py-3">{g.avg_rating ? `${g.avg_rating} ★ (${g.feedback_count})` : '-'}</td>
                    <td className="px-3 py-3"><StatusBadge status={g.status} /></td>
                    <td className="px-3 py-3 text-right">{g.status !== 'closed' && <Button size="sm" variant="ghost" onClick={() => setClosing(g)}>Close</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={!!closing} onClose={() => setClosing(null)} title={`Close ${closing?.name}?`}
        footer={<><Button variant="secondary" onClick={() => setClosing(null)}>Cancel</Button><Button variant="danger" onClick={close}>Close group</Button></>}>
        <p className="text-sm text-slate-600">Members are notified and go back into the matching pool. Chat, sessions and ratings are kept for the evaluation.</p>
      </Modal>
    </div>
  );
}
