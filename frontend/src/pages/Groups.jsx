import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UsersRound } from 'lucide-react';
import api, { errorText } from '../api';
import InvitationCard from '../components/InvitationCard';
import { AvatarStack, Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader, Spinner, Tabs, Tile, tileColor, useToast } from '../components/ui';
import { useApi } from '../lib/hooks';

const KIND = { manual: 'Open group', ai_group: 'AI study group', buddy: 'Study buddies' };

function GroupTile({ g }) {
  return (
    <Tile as={Link} to={`/groups/${g.id}`} color={g.id} progress={g.match_score != null ? g.match_score / 100 : undefined}
      className={g.status === 'closed' ? 'opacity-60 grayscale' : 'transition hover:-translate-y-0.5'}>
      <div className="flex items-center justify-between gap-2">
        <AvatarStack people={g.people || []} ring={tileColor(g.id).ring} />
        <div className="flex gap-1.5">
          {g.match_score != null && <Badge tone="white">{Math.round(g.match_score)}%</Badge>}
          <Badge tone="white">{g.status === 'active' ? KIND[g.kind] || 'Group' : g.status === 'closed' ? 'Closed' : 'Waiting'}</Badge>
        </div>
      </div>
      <h3 className="mt-3 truncate text-lg font-bold leading-tight">{g.subject}</h3>
      <p className="mt-1 truncate text-sm text-white/90">{g.meeting_slot || g.name}</p>
    </Tile>
  );
}

function Browse({ onJoined }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/groups');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;
  const rows = data.filter((g) => !q || `${g.name} ${g.subject} ${g.description}`.toLowerCase().includes(q.toLowerCase()));
  const join = async (g) => {
    setBusy(g.id);
    try {
      await api.post(`/groups/${g.id}/join`);
      toast(`You joined ${g.name}`);
      reload();
      onJoined();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search by name or subject" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search groups" />
      </div>
      {rows.length === 0 ? <Card><Empty icon={UsersRound} title="No open groups found">Create the first one for your subject.</Empty></Card> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <Card key={g.id} className="flex flex-col p-5">
              <span className={`self-start rounded-full px-3 py-1 text-xs font-bold text-white ${tileColor(g.id).tile}`}>{g.subject}</span>
              <h3 className="mt-2 font-bold text-slate-900">{g.name}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{g.description || 'No description'}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500">{g.member_count} members</span>
                {g.user_role ? <Link to={`/groups/${g.id}`}><Button size="sm" variant="secondary">Open</Button></Link>
                  : <Button size="sm" onClick={() => join(g)} loading={busy === g.id}>Join</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Groups() {
  const toast = useToast();
  const mine = useApi('/groups/me');
  const [tab, setTab] = useState('mine');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/groups', form);
      toast('Group created - you are its admin');
      setOpen(false);
      setForm({ name: '', subject: '', description: '' });
      mine.reload();
      setTab('mine');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const invites = (mine.data || []).filter((g) => g.status === 'proposed' && g.my_status === 'pending');
  const rest = (mine.data || []).filter((g) => !invites.includes(g));

  return (
    <div className="space-y-6">
      <PageHeader title="Study groups" subtitle="Groups the AI formed for you, your study buddies, and open groups you can join."
        action={<Button icon={Plus} onClick={() => setOpen(true)}>Create group</Button>} />
      <Tabs tabs={[{ value: 'mine', label: `My groups${mine.data ? ` (${mine.data.length})` : ''}` }, { value: 'browse', label: 'Browse open groups' }]} value={tab} onChange={setTab} />
      {tab === 'browse' ? <Browse onJoined={mine.reload} /> : mine.loading ? <Spinner /> : mine.error ? <ErrorBox onRetry={mine.reload}>{mine.error}</ErrorBox> : (
        <div className="space-y-8">
          {invites.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-slate-900">Invitations</h2>
              <div className="grid gap-4 xl:grid-cols-2">{invites.map((g) => <InvitationCard key={g.id} group={g} onDone={mine.reload} />)}</div>
            </section>
          )}
          {rest.length === 0 && invites.length === 0 ? (
            <Card><Empty icon={UsersRound} title="No groups yet" action={<Button onClick={() => setTab('browse')} variant="secondary">Browse open groups</Button>}>
              Use "Find me a study group" on the dashboard, or join an open group.
            </Empty></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rest.map((g) => <GroupTile key={g.id} g={g} />)}</div>
          )}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create an open study group"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create} loading={busy}>Create group</Button></>}>
        <form onSubmit={create} className="space-y-4">
          <ErrorBox>{error}</ErrorBox>
          <div><label className="label" htmlFor="gn">Group name</label><input id="gn" required className="input" placeholder="e.g. Algorithms midterm prep" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label" htmlFor="gs">Subject</label><input id="gs" required className="input" placeholder="e.g. Data Structures & Algorithms" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><label className="label" htmlFor="gd">What will the group do?</label><textarea id="gd" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </form>
      </Modal>
    </div>
  );
}
