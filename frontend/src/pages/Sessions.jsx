import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { Calendar, Clock, MapPin, Users, Activity, Sparkles } from 'lucide-react';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (err) {
        console.error("Failed to fetch all sessions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSessions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pt-16 md:pl-64">
          <div className="max-w-7xl mx-auto p-6 lg:p-10 pb-24">
            
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 mb-10 shadow-2xl">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full">
                       <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Global Academic Timeline</span>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                 </div>
                 <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-3">
                   Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Meetings</span>
                 </h1>
                 <p className="text-lg text-slate-400 font-medium opacity-90">Browse all scheduled study activities across the entire university network.</p>
               </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Global Schedule...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sessions.length === 0 ? (
                  <div className="col-span-full py-20 glass-card rounded-[2.5rem] text-center border-dashed border-2 border-slate-200">
                    <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold text-lg">No sessions scheduled yet.</p>
                    <p className="text-slate-400 text-sm">Be the first to schedule a meeting in your study group!</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="glass-card p-8 rounded-[2.5rem] hover-lift relative overflow-hidden flex flex-col group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                      
                      <div className="flex items-center justify-between mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                           <Users className="h-3 w-3" />
                           {session.group_name || 'Group'}
                        </div>
                        <Sparkles className="h-4 w-4 text-slate-200 group-hover:text-amber-400 transition-colors" />
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-600 transition-colors">
                          {session.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-4">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold">{new Date(session.start_time).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-4 w-4 text-indigo-400" />
                            <span className="text-xs font-bold">
                              {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-emerald-500" />
                           <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">
                              {session.location || 'TBA'}
                           </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
                          {session.duration_minutes}m Session
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
