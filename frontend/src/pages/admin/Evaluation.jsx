import { Download } from 'lucide-react';
import { downloadFile } from '../../api';
import { BarList, Columns, PairedBars } from '../../components/charts';
import { Button, Card, CardHeader, ErrorBox, PageHeader, Spinner, Stat } from '../../components/ui';
import { useApi } from '../../lib/hooks';
import { num, pct, timeAgo } from '../../lib/format';

function corrText(r) {
  if (r === null || r === undefined) return 'Not enough ratings yet';
  const strength = Math.abs(r) >= 0.5 ? 'Strong' : Math.abs(r) >= 0.3 ? 'Moderate' : Math.abs(r) >= 0.1 ? 'Weak' : 'No';
  return `${strength} ${r >= 0 ? 'positive' : 'negative'} link (Pearson r = ${r})`;
}

export default function AdminEvaluation() {
  const { data, error, loading, reload } = useApi('/admin/analytics');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const f = data.feedback;
  const avr = data.ai_vs_random;
  const five = (v) => num(v);

  return (
    <div className="space-y-8">
      <PageHeader title="Evaluation" subtitle="Evidence for the research questions: does AI matching beat traditional grouping, and do students find it fair, useful and easy?"
        action={<div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadFile('/admin/export/feedback', 'studymatch-feedback.csv')}>Ratings CSV</Button>
          <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadFile('/admin/export/survey', 'studymatch-survey.csv')}>Survey CSV</Button>
        </div>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Satisfaction" value={f.overall ? `${num(f.overall)} / 5` : '-'} hint={`${f.count} ratings`} />
        <Stat label="Would continue" value={pct(f.would_continue)} hint="want to keep their group" tone="emerald" />
        <Stat label="Attendance" value={pct(data.engagement.attendance_rate)} hint={`${data.engagement.sessions} sessions`} tone="sky" />
        <Stat label="Usability (SUS)" value={data.survey.sus != null ? num(data.survey.sus, 0) : '-'}
          hint={data.survey.sus != null ? (data.survey.sus >= 68 ? 'above the average of 68' : 'below the average of 68') : 'no answers yet'} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="AI matching vs random grouping" subtitle={`Same students, ${avr.runs} matching runs. Random grouping = the traditional method.`} />
          <div className="p-5">
            <PairedBars series={['AI matching', 'Random grouping']} max={1} format={(v) => pct(v)} rows={[
              { label: 'Compatibility score', values: [avr.ai_avg, avr.random_avg] },
              { label: 'Groups that share a free hour', values: [avr.ai_schedule_ok, avr.random_schedule_ok] },
            ]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Does a higher match score mean happier students?" subtitle={corrText(data.correlation)} />
          <div className="p-5">
            <Columns max={5} format={five} items={data.score_vs_rating.map((b) => ({ label: b.bucket, value: b.avg_rating, note: `${b.count} ratings` }))} />
            <p className="mt-3 text-xs text-slate-500">Average rating (1-5) by the group's match score.</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Collaboration quality" subtitle="Average rating, 1-5" />
          <div className="p-5"><BarList max={5} format={five} items={[
            { label: 'Subjects and goals fit', value: f.compatibility },
            { label: 'Collaboration', value: f.collaboration },
            { label: 'Easy to schedule', value: f.scheduling },
          ]} /></div>
        </Card>
        <Card>
          <CardHeader title="Which factors matter most?" subtitle="Weights learned from ratings (research question 1)" />
          <div className="p-5">
            <PairedBars series={['Starting weight', 'Learned weight']} format={(v) => pct(v)}
              rows={[...data.weights].sort((a, b) => b.current - a.current).map((w) => ({ label: w.label, values: [w.default, w.current] }))} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Fairness, usefulness, ease" subtitle={`${data.survey.count} survey answers, 1-5`} />
          <div className="p-5"><BarList max={5} format={five} items={[
            { label: 'Fair grouping', value: data.survey.fairness },
            { label: 'Useful matches', value: data.survey.usefulness },
            { label: 'Easy to use', value: data.survey.ease },
          ]} /></div>
        </Card>
        <Card>
          <CardHeader title="Usability bands (SUS)" subtitle="Number of students" />
          <div className="p-5"><BarList items={data.survey.bands.map((b) => ({ label: b.band, value: b.count }))} /></div>
        </Card>
        <Card>
          <CardHeader title="Group types" subtitle="Average rating, 1-5" />
          <div className="p-5">
            <BarList max={5} format={five} items={[
              { label: 'AI study groups', value: data.by_kind.group.avg_rating, note: `${data.by_kind.group.count} ratings` },
              { label: 'AI buddy pairs', value: data.by_kind.buddy.avg_rating, note: `${data.by_kind.buddy.count} ratings` },
              { label: 'Open groups', value: data.by_kind.manual.avg_rating, note: `${data.by_kind.manual.count} ratings` },
            ]} />
            <p className="mt-5 text-sm text-slate-600">Invitations accepted: <b className="text-slate-900">{pct(data.engagement.acceptance_rate)}</b></p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="By subject" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-2">Subject</th><th className="px-3 py-2">AI groups</th><th className="px-3 py-2">Avg. match score</th><th className="px-3 py-2">Avg. rating</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.subjects.map((s) => (
                <tr key={s.subject}><td className="px-5 py-2.5 font-medium text-slate-800">{s.subject}</td><td className="px-3 py-2.5">{s.groups}</td>
                  <td className="px-3 py-2.5">{s.avg_score != null ? `${num(s.avg_score, 0)}%` : '-'}</td><td className="px-3 py-2.5">{s.avg_rating ? `${num(s.avg_rating)} / 5` : '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Latest comments" />
        {data.comments.length === 0 ? <p className="p-5 text-sm text-slate-500">No comments yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {data.comments.map((c, i) => (
              <li key={i} className="px-5 py-3"><p className="text-sm text-slate-800">"{c.comment}"</p><p className="mt-0.5 text-xs text-slate-500">{c.group} · {c.rating} ★ · {timeAgo(c.created_at)}</p></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
