import { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import api, { errorText } from '../../api';
import { Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader, Spinner, useToast } from '../../components/ui';
import { useApi } from '../../lib/hooks';

const BLANK = { code: '', name: '', active: true };

export default function AdminSubjects() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/admin/subjects');
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const open = (s) => {
    setEdit(s || 'new');
    setForm(s ? { code: s.code, name: s.name, active: s.active } : BLANK);
    setFormError('');
  };
  const save = async () => {
    setBusy(true);
    setFormError('');
    try {
      if (edit === 'new') await api.post('/admin/subjects', form);
      else await api.put(`/admin/subjects/${edit.id}`, form);
      toast('Subject saved');
      setEdit(null);
      reload();
    } catch (e) {
      setFormError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    try {
      await api.delete(`/admin/subjects/${edit.id}`);
      toast('Subject removed from the catalogue');
      setEdit(null);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" subtitle="The course catalogue students pick from. Students can also type their own subjects."
        action={<Button icon={Plus} onClick={() => open(null)}>Add subject</Button>} />
      {data.length === 0 ? <Card><Empty icon={BookOpen} title="No subjects yet" /></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((s) => (
            <button key={s.id} onClick={() => open(s)} className="card p-5 text-left transition hover:border-brand-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2"><Badge tone="brand">{s.code}</Badge>{!s.active && <Badge>Hidden</Badge>}</div>
              <h3 className="mt-2 font-semibold text-slate-900">{s.name}</h3>
              <p className="mt-3 text-sm text-slate-600"><b>{s.students}</b> students · <b>{s.groups}</b> groups</p>
            </button>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Add a subject' : `Edit ${edit?.code}`}
        footer={<>
          {edit !== 'new' && <Button variant="ghost" className="mr-auto text-rose-600" onClick={remove}>Remove</Button>}
          <Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button>
          <Button onClick={save} loading={busy}>Save</Button>
        </>}>
        <div className="space-y-4">
          <ErrorBox>{formError}</ErrorBox>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <div><label className="label" htmlFor="code">Code</label><input id="code" className="input uppercase" placeholder="IT2030" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div><label className="label" htmlFor="sname">Name</label><input id="sname" className="input" placeholder="Database Systems" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Show this subject to students
          </label>
        </div>
      </Modal>
    </div>
  );
}
