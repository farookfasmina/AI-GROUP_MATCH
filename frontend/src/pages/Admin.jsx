import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, Clock, ShieldAlert, ShieldPlus, UserMinus, Trash2, ShieldX, Sliders, Sparkles } from 'lucide-react';
import api from '../api';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [weights, setWeights] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      const usersRes = await api.get('/admin/users');
      const weightsRes = await api.get('/admin/weights');
      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setWeights(weightsRes.data);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunOptimization = async () => {
    setOptimizing(true);
    try {
      const res = await api.post('/admin/optimize-weights');
      setWeights(res.data);
      alert("Dynamic weights optimization completed! Algorithmic weights adjusted to success feedback signatures.");
    } catch (err) {
      alert("Optimization loop failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    if (user?.is_platform_admin) {
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleToggleAdmin = async (u) => {
    if (u.id === user.id) {
      alert("You cannot demote yourself.");
      return;
    }
    
    if (window.confirm(`Are you sure you want to ${u.is_admin ? 'demote' : 'promote'} ${u.email}?`)) {
      try {
        await api.patch(`/admin/users/${u.id}/toggle-admin`);
        fetchAdminData(); // Refresh list
      } catch (err) {
        alert(err.response?.data?.detail || "Action failed");
      }
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === user.id) {
      alert("You cannot delete your own account from here.");
      return;
    }

    if (window.confirm(`PERMANENT ACTION: Are you sure you want to DELETE user ${u.email}? All their data including groups and preferences will be lost.`)) {
      try {
        await api.delete(`/admin/users/${u.id}`);
        fetchAdminData(); // Refresh list
      } catch (err) {
        alert(err.response?.data?.detail || "Deletion failed");
      }
    }
  };

  if (!user?.is_platform_admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8 pt-24 md:pl-64 flex items-center justify-center">
             <div className="bg-white p-12 text-center rounded-2xl border border-rose-200 shadow-sm max-w-md w-full">
               <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
               <p className="text-rose-600 font-bold mb-2 text-xl">Admin Lockout</p>
               <p className="text-rose-500 text-sm font-medium">You need an elevated global permission level to view this dashboard.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-24 md:pl-64">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-12">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Platform Command Center</h1>
            <p className="text-slate-600 font-medium mb-8">System health, scale metrics, and user moderation pipeline.</p>
            
            {loading ? (
              <div className="animate-pulse space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                </div>
                <div className="h-64 bg-slate-200 rounded-2xl"></div>
              </div>
            ) : error ? (
               <div className="p-4 bg-rose-50 text-rose-600 rounded-lg">{error}</div>
            ) : (
              <>
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="bg-white border border-indigo-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Users className="h-32 w-32 text-indigo-900" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-indigo-600 font-bold text-sm tracking-wide uppercase">
                      <Users className="h-5 w-5" /> Total Active Users
                    </div>
                    <p className="text-5xl font-black text-slate-900">{stats?.total_users || 0}</p>
                  </div>
                  
                  <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                      <BookOpen className="h-32 w-32 text-emerald-900" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-emerald-600 font-bold text-sm tracking-wide uppercase">
                      <BookOpen className="h-5 w-5" /> Gross Study Groups
                    </div>
                    <p className="text-5xl font-black text-slate-900">{stats?.total_groups || 0}</p>
                  </div>
                  
                  <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Clock className="h-32 w-32 text-rose-900" />
                    </div>
                    <div className="flex items-center gap-3 mb-4 text-rose-600 font-bold text-sm tracking-wide uppercase">
                      <Clock className="h-5 w-5" /> Upcoming Sessions
                    </div>
                    <p className="text-5xl font-black text-slate-900">{stats?.total_sessions || 0}</p>
                  </div>
                </div>

                {/* AI Matching Parameter Tuning */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 animate-fade-in">
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-indigo-600" />
                        AI Matching Weight Tuning
                      </h3>
                      <button
                        onClick={handleRunOptimization}
                        disabled={optimizing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {optimizing ? "Optimizing..." : "Run AI Learning Loop"}
                      </button>
                    </div>

                    {weights ? (
                      <div className="space-y-4">
                        {Object.entries(weights).map(([key, val]) => {
                          const percent = Math.round(val * 100);
                          const readableName = key.replace(/_/g, ' ').replace('match', 'alignment').toUpperCase();
                          return (
                            <div key={key} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold text-slate-500 tracking-wider">
                                <span>{readableName}</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">Loading AI weights...</p>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        Adaptive Learning Loop
                      </h3>
                      <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                        Our dynamic learning algorithm analyzes all matching feedbacks with high collaboration outcomes (ratings &ge; 4.0). 
                      </p>
                      <p className="text-xs text-indigo-200 leading-relaxed">
                        It averages similarities across all success indicators, aligns them dynamically via a moving average ($\alpha = 0.2$), and saves new model tuning parameters to prioritize traits that work best in practice.
                      </p>
                    </div>
                    <div className="border-t border-indigo-800 pt-4 mt-6 text-[10px] text-indigo-300 font-medium">
                      Objective 2 / Evaluation Telemetry Module
                    </div>
                  </div>
                </div>

                {/* User Directory Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-900 text-lg">Platform User Directory</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">{usersList.length} Networked</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                           <th className="p-4 font-bold">Email</th>
                           <th className="p-4 font-bold">Full Name</th>
                           <th className="p-4 font-bold">University</th>
                           <th className="p-4 font-bold">Registration Date</th>
                           <th className="p-4 font-bold">Role</th>
                           <th className="p-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersList.map((u) => (
                           <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-slate-900 font-medium">{u.email}</td>
                              <td className="p-4 text-slate-700">{u.full_name || '-'}</td>
                              <td className="p-4 text-slate-700">{u.university || '-'}</td>
                              <td className="p-4 text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                              <td className="p-4">
                                {u.is_admin ? (
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold uppercase tracking-wider border border-amber-200">Admin</span>
                                ) : (
                                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider border border-slate-200">User</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleToggleAdmin(u)}
                                    title={u.is_admin ? "Demote to User" : "Promote to Admin"}
                                    className={`p-2 rounded-lg transition-colors ${u.is_admin ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                                  >
                                    {u.is_admin ? <ShieldX className="h-4 w-4" /> : <ShieldPlus className="h-4 w-4" />}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u)}
                                    title="Delete User"
                                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                    {usersList.length === 0 && (
                      <div className="text-center p-8 text-slate-500">No users found.</div>
                    )}
                  </div>
                </div>
              </>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
