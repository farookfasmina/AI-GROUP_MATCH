import { useState } from 'react';
import { Brain, RotateCcw, Sparkles } from 'lucide-react';
import api, { errorText } from '../../api';
import { PairedBars } from '../../components/charts';
import { Badge, Button, Card, CardHeader, Empty, ErrorBox, PageHeader, Spinner, cx, useToast } from '../../components/ui';
import { useApi } from '../../lib/hooks';
import { dateTime, pct } from '../../lib/format';

function RunTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-5 py-2">Subject</th><th className="px-3 py-2">Students</th><th className="px-3 py-2">Groups</th><th className="px-3 py-2">Pairs</th><th className="px-3 py-2">Not matched</th><th className="px-3 py-2">AI score</th><th className="px-3 py-2">Random</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((x) => (
            <tr key={x.subject}><td className="px-5 py-2 font-medium text-slate-800">{x.subject}</td><td className="px-3 py-2">{x.considered}</td><td className="px-3 py-2">{x.groups}</td>
              <td className="px-3 py-2">{x.pairs}</td><td className="px-3 py-2">{x.unmatched}</td><td className="px-3 py-2 font-semibold text-emerald-700">{pct(x.ai_avg)}</td><td className="px-3 py-2">{pct(x.random_avg)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminMatching() {
  const toast = useToast();
  const subjects = useApi('/admin/subjects');
  const runs = useApi('/admin/matching/runs');
  const model = useApi('/admin/weights');
  const [chosen, setChosen] = useState([]);
  const [minSize, setMinSize] = useState(3);
  const [maxSize, setMaxSize] = useState(5);
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);

  if (subjects.loading || runs.loading || model.loading) return <Spinner />;
  const err = subjects.error || runs.error || model.error;
  if (err) return <ErrorBox>{err}</ErrorBox>;

  const run = async () => {
    setBusy('run');
    try {
      const r = await api.post('/admin/matching/run', { subjects: chosen, min_size: minSize, max_size: maxSize });
      setResult(r.data);
      toast(`${r.data.stats.groups} groups and ${r.data.stats.pairs} buddy pairs formed - students were notified`);
      runs.reload();
      subjects.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const learn = async (reset) => {
    setBusy(reset ? 'reset' : 'learn');
    try {
      if (reset) await api.post('/admin/weights/reset');
      else {
        const r = await api.post('/admin/optimize-weights');
        toast(`${r.data.message} Accuracy ${pct(r.data.accuracy)}.`);
      }
      model.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const toggle = (name) => setChosen((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));
  const m = model.data;
  const latest = m.history[0];

  return (
    <div className="space-y-8">
      <PageHeader title="AI matching" subtitle="Form study groups and buddy pairs for every student who is still waiting." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Run group formation" subtitle="Only students without a group for that subject are included" icon={Sparkles} />
          <div className="space-y-5 p-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="label mb-0">Subjects</p>
                <button className="text-sm font-semibold text-brand-600" onClick={() => setChosen([])}>All subjects</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjects.data.filter((s) => s.active).map((s) => {
                  const on = chosen.includes(s.name);
                  return (
                    <button key={s.id} onClick={() => toggle(s.name)} aria-pressed={on}
                      className={cx('rounded-full border px-3 py-1.5 text-sm font-medium transition', on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:border-slate-400')}>
                      {s.name} <span className="text-slate-400">· {s.students}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">{chosen.length ? `${chosen.length} selected` : 'No selection = every subject students chose'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
              <div><label className="label" htmlFor="mn">Smallest group</label>
                <select id="mn" className="input" value={minSize} onChange={(e) => setMinSize(Number(e.target.value))}>{[3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
              <div><label className="label" htmlFor="mx">Largest group</label>
                <select id="mx" className="input" value={maxSize} onChange={(e) => setMaxSize(Number(e.target.value))}>{[4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></div>
            </div>
            <Button onClick={run} loading={busy === 'run'} icon={Sparkles} size="lg">Run AI matching</Button>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="How the AI decides" icon={Brain} />
          <ol className="space-y-3 p-5 text-sm text-slate-600">
            <li><b className="text-slate-800">1. KNN</b> (scikit-learn NearestNeighbors, cosine) finds the most similar students from subjects, 168 weekly hours, study type and style.</li>
            <li><b className="text-slate-800">2. Re-rank</b> every pair on 7 factors - shared free time, complementary competency, collaboration style fit and more.</li>
            <li><b className="text-slate-800">3. Form groups</b> - hardest-to-place first, then swap members while the score improves. Everyone in a group shares a free hour.</li>
            <li><b className="text-slate-800">4. Learn</b> - logistic regression on ratings re-weights the 7 factors.</li>
            <li><b className="text-slate-800">5. Compare</b> each run with random grouping of the same students.</li>
          </ol>
        </Card>
      </div>

      {result && (
        <Card className="border-emerald-200">
          <CardHeader title="Matching finished" subtitle={dateTime(result.created_at)} icon={Sparkles} />
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <div><p className="text-sm text-slate-500">Students considered</p><p className="text-xl font-bold">{result.stats.considered}</p></div>
            <div><p className="text-sm text-slate-500">Groups / pairs</p><p className="text-xl font-bold">{result.stats.groups} / {result.stats.pairs}</p></div>
            <div><p className="text-sm text-slate-500">AI avg. score</p><p className="text-xl font-bold text-emerald-700">{pct(result.stats.ai_avg)}</p></div>
            <div><p className="text-sm text-slate-500">Random grouping</p><p className="text-xl font-bold">{pct(result.stats.random_avg)}</p></div>
          </div>
          {result.stats.subjects?.length > 0 ? <RunTable rows={result.stats.subjects} /> : <p className="px-5 pb-5 text-sm text-slate-500">Everyone who is ready already has a group for each subject.</p>}
        </Card>
      )}

      <Card>
        <CardHeader title="Factor weights" icon={Brain}
          subtitle={latest ? `${latest.note}${latest.accuracy != null ? ` · prediction accuracy ${pct(latest.accuracy)}` : ''}` : 'Starting weights - nothing learned yet'}
          action={<div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={RotateCcw} loading={busy === 'reset'} onClick={() => learn(true)}>Reset</Button>
            <Button size="sm" icon={Brain} loading={busy === 'learn'} onClick={() => learn(false)}>Re-learn from feedback</Button>
          </div>} />
        <div className="p-5">
          <PairedBars series={['Starting weight', 'Current (learned) weight']} format={(v) => pct(v)}
            rows={m.factors.map((f) => ({ label: f.label, values: [m.default[f.key], m.current[f.key]] }))} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Run history" />
        {runs.data.length === 0 ? <Empty title="No runs yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-2">When</th><th className="px-3 py-2">Started by</th><th className="px-3 py-2">Matched</th><th className="px-3 py-2">Groups</th><th className="px-3 py-2">Pairs</th><th className="px-3 py-2">AI score</th><th className="px-3 py-2">Random</th><th className="px-3 py-2">Shared time (random)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-2.5">{dateTime(r.created_at)}</td>
                    <td className="px-3 py-2.5"><Badge tone={r.trigger === 'admin' ? 'violet' : r.trigger === 'student' ? 'sky' : 'slate'}>{r.trigger}</Badge></td>
                    <td className="px-3 py-2.5">{r.stats.matched ?? 0}/{r.stats.considered ?? 0}</td>
                    <td className="px-3 py-2.5">{r.stats.groups ?? 0}</td><td className="px-3 py-2.5">{r.stats.pairs ?? 0}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-700">{pct(r.stats.ai_avg)}</td><td className="px-3 py-2.5">{pct(r.stats.random_avg)}</td>
                    <td className="px-3 py-2.5">{pct(r.stats.random_schedule_ok)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
