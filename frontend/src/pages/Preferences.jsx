import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import api, { errorText } from '../api';
import { AvailabilitySection, StyleSection, SubjectsSection, formToPref, keysToAvailability, prefToForm, validate } from '../components/ProfileForm';
import { Button, Card, ErrorBox, PageHeader, Spinner, Tabs, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const TABS = [{ value: 'subjects', label: 'Subjects' }, { value: 'style', label: 'Study style' }, { value: 'availability', label: 'Free time' }];

export default function Preferences() {
  const toast = useToast();
  const { refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [catalogue, setCatalogue] = useState([]);
  const [tab, setTab] = useState('subjects');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/preferences/me'), api.get('/availability'), api.get('/preferences/subjects')])
      .then(([p, a, s]) => {
        setForm(prefToForm(p.data, a.data));
        setCatalogue(s.data);
      })
      .catch((e) => setError(errorText(e)));
  }, []);
  if (!form) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;
  const set = (patch) => setForm((f) => ({ ...f, ...(typeof patch === 'function' ? patch(f) : patch) }));

  const save = async () => {
    for (const step of ['subjects', 'style', 'availability']) {
      const problem = validate(form, step);
      if (problem) {
        setTab(step);
        return setError(problem);
      }
    }
    setBusy(true);
    setError('');
    try {
      await api.put('/preferences/me', formToPref(form));
      await api.post('/availability', keysToAvailability(form.availability));
      await refresh();
      toast('Saved - your next matches use these preferences');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Preferences" subtitle="What the matching uses. Groups you already have stay as they are."
        action={<Button onClick={save} loading={busy} icon={Save}>Save changes</Button>} />
      <ErrorBox>{error}</ErrorBox>
      <Card>
        <div className="px-2 pt-2"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>
        <div className="p-5 sm:p-8">
          {tab === 'subjects' && <SubjectsSection form={form} set={set} catalogue={catalogue} />}
          {tab === 'style' && <StyleSection form={form} set={set} />}
          {tab === 'availability' && <AvailabilitySection form={form} set={set} />}
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-4"><Button onClick={save} loading={busy} icon={Save}>Save changes</Button></div>
      </Card>
    </div>
  );
}
