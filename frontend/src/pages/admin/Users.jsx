import { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import api, { errorText } from '../../api';
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Modal, PageHeader, Spinner, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../lib/hooks';
import { dateOnly } from '../../lib/format';

export default function AdminUsers() {
  const toast = useToast();
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi('/admin/users');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [del, setDel] = useState(null);
  const rows = useMemo(() => (data || []).filter((u) => (role === 'all' || (role === 'admin') === u.is_admin)
    && (!q || `${u.full_name} ${u.email} ${u.subjects}`.toLowerCase().includes(q.toLowerCase()))), [data, q, role]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox onRetry={reload}>{error}</ErrorBox>;

  const act = async (fn, ok) => {
    try {
      const r = await fn();
      toast(ok || r.data.message);
      setDel(null);
      reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle={`${data.filter((u) => !u.is_admin).length} students · ${data.filter((u) => u.is_admin).length} admins`} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, email or subject" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        </div>
        <select className="input sm:w-40" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="all">Everyone</option><option value="student">Students</option><option value="admin">Admins</option>
        </select>
      </div>
      <Card>
        {rows.length === 0 ? <Empty icon={Users} title="Nobody matches your search" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Name</th><th className="px-3 py-3">Subjects</th><th className="px-3 py-3">Profile</th><th className="px-3 py-3">Groups</th><th className="px-3 py-3">Joined</th><th className="px-3 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar name={u.full_name} id={u.id} size="sm" />
                      <div><p className="font-semibold text-slate-900">{u.full_name} {u.is_admin && <Badge tone="violet">Admin</Badge>} {u.is_demo && <Badge>Demo</Badge>}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></td>
                    <td className="px-3 py-3"><p className="max-w-[16rem] truncate text-slate-600" title={u.subjects}>{u.subjects || '-'}</p></td>
                    <td className="px-3 py-3">{u.is_admin ? '-' : u.consent_given && u.subjects && u.free_slots ? <Badge tone="emerald">Ready</Badge> : <Badge tone="amber">Not finished</Badge>}</td>
                    <td className="px-3 py-3">{u.groups}</td>
                    <td className="px-3 py-3 text-slate-500">{dateOnly(u.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {u.id !== user.id && <>
                        <Button size="sm" variant="ghost" onClick={() => act(() => api.patch(`/admin/users/${u.id}/toggle-admin`))}>{u.is_admin ? 'Remove admin' : 'Make admin'}</Button>
                        <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDel(u)}>Delete</Button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Modal open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.full_name}?`}
        footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" onClick={() => act(() => api.delete(`/admin/users/${del.id}`), 'User deleted')}>Delete</Button></>}>
        <p className="text-sm text-slate-600">This removes the account with its preferences, memberships, messages and ratings. Groups they created stay, owned by you. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
