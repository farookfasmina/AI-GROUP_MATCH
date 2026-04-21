import { User, CheckCircle2, UserPlus, Calendar, Sparkles, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function MatchCard({ match, onConnect, onSchedule }) {
  const [isConnected, setIsConnected] = useState(false);
  
  // Determine gradient map based on score
  const isHighMatch = match.compatibility_score >= 75;
  const badgeColor = isHighMatch ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-indigo-100 text-indigo-800 border-indigo-200";
  const iconColor = isHighMatch ? "text-emerald-500" : "text-indigo-500";
  const accentColor = isHighMatch ? "from-emerald-50 to-white" : "from-indigo-50 to-white";

  const handleConnectClick = async (e) => {
    e.stopPropagation();
    if (isConnected) return;
    
    const success = await onConnect(match.target_user_id);
    if (success) setIsConnected(true);
  };

  return (
    <div className={`relative overflow-hidden group bg-gradient-to-br ${accentColor} p-0.5 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-slate-100`}>
      {/* Dynamic Glow Effect */}
      <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${isHighMatch ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>
      
      <div className="bg-white/80 backdrop-blur-md rounded-[22px] p-6 h-full flex flex-col relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl ${isHighMatch ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'} border flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-3 transition-transform duration-300`}>
              <User className={`h-8 w-8 ${iconColor}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{match.full_name}</h3>
                {isHighMatch && <Sparkles className="h-4 w-4 text-amber-400" />}
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{match.department}</p>
            </div>
          </div>
          <div className={`inline-flex items-center px-3.5 py-2 rounded-2xl border ${badgeColor} shadow-sm`}>
            <span className="text-sm font-black tracking-tighter">{match.compatibility_score}%</span>
          </div>
        </div>

        {/* Shared Subjects / Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {match.shared_subjects?.slice(0, 3).map((sub, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
              {sub}
            </span>
          ))}
          {match.learning_style && (
             <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1">
               <BookOpen className="h-3 w-3" /> {match.learning_style}
             </span>
          )}
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-6 group-hover:bg-white transition-colors">
            <div className="flex items-start gap-3">
              <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{match.explanation}"</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleConnectClick}
              disabled={isConnected}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 ${
                isConnected 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' 
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95'
              }`}
            >
              {isConnected ? <CheckCircle2 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isConnected ? 'Connected' : 'Connect'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSchedule(match); }}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all duration-300 active:scale-95"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
