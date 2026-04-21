import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { Users, BookOpen, Bell, Calendar, ChevronRight, Activity, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import AIAssistantWidget from '../components/AIAssistantWidget';

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
    matchesCount: 0,
    groupsCount: 0,
    unreadNotifs: 0,
    availabilities: 0
  });

  const [upcomingSession, setUpcomingSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [matchesRes, groupsRes, notifsRes, availRes, sessionsRes] = await Promise.allSettled([
          api.get('/matches/me'),
          api.get('/groups'), 
          api.get('/notifications'),
          api.get('/availability'),
          api.get('/sessions/me')
        ]);
        
        let mCount = matchesRes.status === 'fulfilled' ? matchesRes.value.data.length : 0;
        let gCount = groupsRes.status === 'fulfilled' ? groupsRes.value.data.length : 0;
        let nCount = notifsRes.status === 'fulfilled' ? notifsRes.value.data.filter(n => !n.is_read).length : 0;
        let aCount = availRes.status === 'fulfilled' ? availRes.value.data.length : 0;
        
        if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.length > 0) {
          setUpcomingSession(sessionsRes.value.data[0]);
        }

        setStats({
          matchesCount: mCount,
          groupsCount: gCount,
          unreadNotifs: nCount,
          availabilities: aCount
        });
      } catch (err) {
        console.error("Dashboard metric fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Matches",
      value: stats.matchesCount,
      icon: Users,
      color: "text-indigo-600",
      link: "/matches"
    },
    {
      title: "Groups",
      value: stats.groupsCount,
      icon: BookOpen,
      color: "text-emerald-600",
      link: "/groups"
    },
    {
      title: "Alerts",
      value: stats.unreadNotifs,
      icon: Bell,
      color: "text-rose-600",
      link: "/notifications"
    },
    {
      title: "Schedule",
      value: stats.availabilities,
      icon: Zap,
      color: "text-amber-600",
      link: "/preferences"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Adjusting top and left padding to account for fixed Navbar (h-16) and Sidebar (w-64) */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pt-16 md:pl-64">
          <div className="max-w-7xl mx-auto p-6 lg:p-10 pb-24">
            
            {/* Header: Pro Greeting Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 mb-10 shadow-2xl animate-pro-fade-in">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-400/20 rounded-full">
                         <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Core Synchronized</span>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   </div>
                   <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-3">
                     Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{currentUser?.full_name?.split(' ')[0] || 'Member'}</span>!
                   </h1>
                   <p className="text-lg text-slate-400 font-medium opacity-90">Your academic synergy is reaching peak optimization.</p>
                 </div>
                 
                 <div className="hidden lg:flex items-center gap-6 pb-2">
                    <div className="text-right border-r border-slate-800 pr-6">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Node Identifier</p>
                       <p className="text-sm font-black text-white">{currentUser?.university || "Virtual Center"}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-sm font-black text-emerald-400">Authenticated</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Metric Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <Link 
                    key={idx} 
                    to={card.link}
                    className="group glass-card p-8 rounded-[2rem] hover-lift animate-card-float"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-10">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <Icon className={`h-6 w-6 ${card.color} group-hover:scale-110 transition-transform`} />
                       </div>
                       <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                     <div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                          {loading ? "..." : card.value}
                        </p>
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          {card.title}
                          <div className={`h-1.5 w-1.5 rounded-full ${card.color.replace('text-', 'bg-')}`} />
                        </h3>
                     </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Action Matrix: Widgets & Session */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 animate-pro-fade-in delay-500">
                 <AIAssistantWidget />
               </div>
               
               <div className="lg:col-span-4 space-y-8">
                 {/* Session Card */}
                 <div className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col animate-pro-fade-in delay-700">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                    
                    <div className="flex items-center gap-4 mb-10">
                       <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <Activity className="h-6 w-6 text-indigo-600" />
                       </div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight">Timeline</h3>
                    </div>
                    
                    {upcomingSession ? (
                      <div className="mt-2 space-y-6 flex-1">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Next Session</p>
                          <p className="text-2xl font-black text-indigo-900 leading-[1.1] mb-2">{upcomingSession.title}</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                             <Calendar className="h-3 w-3" />
                             {new Date(upcomingSession.start_time).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                           <p className="text-sm font-black text-slate-900 mb-1">
                             {new Date(upcomingSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                           <p className="text-xs font-bold text-slate-500 uppercase">Duration: {upcomingSession.duration_minutes}m</p>
                        </div>
                        
                        <div className="pt-4 mt-auto">
                           <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 shadow-xl transition-all hover-lift">
                              Join Deployment Hub
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                         <div className="mb-6 p-6 bg-slate-50 rounded-full">
                           <Zap className="h-8 w-8 text-slate-300" />
                         </div>
                         <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">No Active Tracks</p>
                         <p className="text-xs font-medium text-slate-400 px-10">Sync with a Study Group to initialize session data.</p>
                      </div>
                    )}
                 </div>
               </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
