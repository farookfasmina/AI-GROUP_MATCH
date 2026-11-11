import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ClipboardCheck, Gauge, Mail, MessageSquare, RotateCcw, Sparkles, Star, Trash2, UserCheck, Users, UsersRound } from 'lucide-react';
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
  const [confirm, setConfirm] = useState(null); // 'remove' | 'reset'
  const [busy, setBusy] = useState(false);
  const [mail, setMail] = useState(null);
  const [mailBusy, setMailBusy] = useState(false);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const changeDemo = async () => {
    setBusy(true);
    try {
      if (confirm === 'reset') {
        const r = await api.post('/admin/demo/reset');
        toast(`Demo data is fresh again: ${r.data.students} demo students`);
      } else {
        const r = await api.post('/admin/demo/clear');
        toast(`Removed ${r.data.removed} demo students and their groups`);
      }
      setConfirm(null);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const testEmail = async () => {
    setMailBusy(true);
    try {
      const r = await api.post('/admin/email-test');
      setMail(r.data);
    } catch (e) {
      setMail({ ok: false, message: errorText(e) });
    } finally {
      setMailBusy(false);
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
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirm('reset')}>Reset demo data</Button>
            <Button variant="secondary" icon={Trash2} onClick={() => setConfirm('remove')}>Remove demo data</Button>
          </div>
        </Card>
      )}
      {data.demo_users === 0 && (
        <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-semibold text-slate-900">No demo data</p>
            <p className="text-sm text-slate-600">Load 48 demo students with groups, ratings and surveys to show how the platform works.</p>
          </div>
          <Button variant="secondary" icon={RotateCcw} onClick={() => setConfirm('reset')}>Load demo data</Button>
        </Card>
      )}
      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Email codes</p>
          <p className={`text-sm ${mail ? (mail.ok ? 'text-emerald-700' : 'text-rose-700') : 'text-slate-600'}`}>
            {mail ? mail.message : 'Sign-up and password-reset codes are sent by email. Send a test email to check that sending works.'}
          </p>
        </div>
        <Button variant="secondary" icon={Mail} loading={mailBusy} onClick={testEmail}>Send a test email</Button>
      </Card>
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
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm === 'reset' ? 'Reset the demo data?' : 'Remove all demo data?'}
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={changeDemo}>{confirm === 'reset' ? 'Reset demo data' : 'Remove demo data'}</Button></>}>
        <p className="text-sm text-slate-600">This deletes the {data.demo_users} demo students (including student@demo.lk), every group they were in, their ratings, surveys, matching runs and learned weights. Real students are kept. This cannot be undone.</p>
        {confirm === 'reset' && <p className="mt-3 text-sm text-slate-600">Then 48 fresh demo students are loaded, with some left waiting so that Run AI matching forms new groups. This can take up to a minute.</p>}
      </Modal>
    </div>
  );
}
