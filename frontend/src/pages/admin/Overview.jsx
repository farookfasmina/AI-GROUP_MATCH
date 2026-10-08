import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardCheck, Gauge, MessageSquare, Sparkles, Star, Trash2, UserCheck, Users, UsersRound } from 'lucide-react';
import api, { errorText } from '../../api';
import { Columns } from '../../components/charts';
import { Button, Card, CardHeader, Empty, ErrorBox, Modal, PageHeader, Spinner, Stat, useToast } from '../../components/ui';
import { useApi } from '../../lib/hooks';
import { dateTime, num, pct } from '../../lib/format';

export function RunLine({ run }) {
  const s = run.stats || {};
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
      <span className="font-semibold text-slate-900">{dateTime(run.created_at)}</span>
      <span className="text-slate-500">by {run.trigger}</span>
      <span className="text-slate-700">{s.groups ?? 0} groups · {s.pairs ?? 0} buddy pairs · {s.matched ?? 0}/{s.considered ?? 0} matched</span>
      <span className="text-slate-700">AI {pct(s.ai_avg)} vs random {pct(s.random_avg)}</span>
    </div>
  );
}

export default function AdminOverview() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/admin/stats');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const clearDemo = async () => {
    setBusy(true);
    try {
      const r = await api.post('/admin/demo/clear');
      toast(`Removed ${r.data.removed} demo students and their groups`);
      setConfirm(false);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Admin overview" subtitle="How the platform is doing right now."
        action={<Link to="/admin/matching"><Button icon={Sparkles}>Run AI matching</Button></Link>} />
      {data.demo_users > 0 && (
        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Demo data is loaded</p>
            <p className="text-sm text-slate-600">{data.demo_users} demo students with simulated groups, ratings and surveys. Remove them before collecting real research data - demo numbers are not research results.</p>
          </div>
          <Button variant="secondary" icon={Trash2} onClick={() => setConfirm(true)}>Remove demo data</Button>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={data.students} hint={`${data.ready_students} ready to be matched`} icon={Users} />
        <Stat label="Matched students" value={data.matched_students} hint={`${data.pending_invites} invitations waiting`} icon={UserCheck} tone="emerald" />
        <Stat label="Groups" value={data.ai_groups + data.buddy_pairs + data.manual_groups} hint={`${data.ai_groups} AI · ${data.buddy_pairs} buddy · ${data.manual_groups} open`} icon={UsersRound} tone="violet" />
        <Stat label="Avg. match score" value={data.avg_match_score != null ? `${num(data.avg_match_score, 0)}%` : '-'} hint="active AI groups" icon={Gauge} tone="sky" />
        <Stat label="Avg. rating" value={data.avg_rating ? `${num(data.avg_rating)} / 5` : '-'} hint={`${data.feedback_count} ratings`} icon={Star} tone="amber" />
        <Stat label="Attendance" value={pct(data.attendance_rate)} hint={`${data.total_sessions} sessions`} icon={CalendarCheck} tone="emerald" />
        <Stat label="Usability (SUS)" value={data.sus_avg != null ? num(data.sus_avg, 0) : '-'} hint={`${data.survey_count} survey answers`} icon={ClipboardCheck} />
        <Stat label="Messages" value={data.messages} hint="in group chats" icon={MessageSquare} tone="rose" />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Recent matching runs" action={<Link to="/admin/matching" className="text-sm font-semibold text-brand-600 hover:underline">All runs</Link>} />
          {data.recent_runs.length === 0 ? <Empty title="No runs yet" /> : (
            <ul className="divide-y divide-slate-100">{data.recent_runs.map((r) => <li key={r.id} className="px-5 py-3"><RunLine run={r} /></li>)}</ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="New students per day" subtitle="Last 14 days with sign-ups" />
          <div className="p-5"><Columns height={160} items={data.signups.slice(-8).map(([d, c]) => ({ label: d.slice(5), value: c }))} /></div>
        </Card>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Remove all demo data?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" loading={busy} onClick={clearDemo}>Remove demo data</Button></>}>
        <p className="text-sm text-slate-600">This deletes the {data.demo_users} demo students (including student@demo.lk), every group they were in, their ratings, surveys, matching runs and learned weights. Real students are kept. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
