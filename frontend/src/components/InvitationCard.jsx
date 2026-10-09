import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import api, { errorText } from '../api';
import { AvatarStack, Badge, Tile, tileColor, useToast } from './ui';

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
    <Tile color={group.id} progress={(group.match_score || 0) / 100}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AvatarStack people={group.people || []} ring={tileColor(group.id).ring} />
            <Badge tone="white">{group.kind === 'buddy' ? 'Study buddy' : `Group of ${group.member_count}`}</Badge>
          </div>
          <h3 className="mt-3 text-xl font-bold leading-tight">{group.subject}</h3>
          {group.meeting_slot && <p className="mt-1 flex items-center gap-1 text-sm text-white/90"><Clock className="h-3.5 w-3.5" />{group.meeting_slot}</p>}
        </div>
        <div className="shrink-0 rounded-2xl bg-white/25 px-3 py-2 text-center">
          <p className="text-2xl font-extrabold leading-none">{Math.round(group.match_score || 0)}%</p>
          <p className="mt-1 text-[11px] font-semibold text-white/90">match</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-white/95">
        {(group.reasons || []).slice(0, 3).map((r) => <li key={r} className="flex gap-2"><span>✓</span>{r}</li>)}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => respond(true)} disabled={!!busy} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-900 shadow hover:bg-slate-50 disabled:opacity-60">
          {busy === 'yes' ? 'Joining...' : 'Accept'}
        </button>
        <button onClick={() => respond(false)} disabled={!!busy} className="rounded-full bg-white/25 px-5 py-2 text-sm font-bold text-white hover:bg-white/35 disabled:opacity-60">
          {busy === 'no' ? 'Declining...' : 'Decline'}
        </button>
        <Link to={`/groups/${group.id}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-white hover:underline">
          See members <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Tile>
  );
}
