import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import api, { errorText } from '../api';
import { Badge, Button, Card, ScoreRing, useToast } from './ui';

// An AI group invitation with Accept / Decline.
export default function InvitationCard({ group, onDone }) {
  const toast = useToast();
  const [busy, setBusy] = useState(null);

  const respond = async (accept) => {
    setBusy(accept ? 'yes' : 'no');
    try {
      const r = await api.post(`/groups/${group.id}/respond`, { accept });
      toast(accept ? (r.data.group_status === 'active' ? 'Joined - the group is now active' : 'Accepted - waiting for the others') : 'Invitation declined');
      window.dispatchEvent(new Event('sm:notifications'));
      onDone?.();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="overflow-hidden border-brand-200">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <ScoreRing score={(group.match_score || 0) / 100} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{group.kind === 'buddy' ? 'Study buddy' : 'Study group'}</Badge>
            <span className="text-xs text-slate-500">{group.member_count} people</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{group.subject}</h3>
          {group.meeting_slot && <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600"><Clock className="h-3.5 w-3.5" />{group.meeting_slot}</p>}
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {(group.reasons || []).slice(0, 3).map((r) => <li key={r} className="flex gap-2"><span className="text-emerald-600">✓</span>{r}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
        <Button size="sm" onClick={() => respond(true)} loading={busy === 'yes'} disabled={!!busy}>Accept</Button>
        <Button size="sm" variant="secondary" onClick={() => respond(false)} loading={busy === 'no'} disabled={!!busy}>Decline</Button>
        <Link to={`/groups/${group.id}`} className="ml-auto inline-flex items-center gap-1 self-center text-sm font-semibold text-brand-600 hover:underline">
          See members <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
