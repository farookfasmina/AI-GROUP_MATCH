import { useState, useEffect } from 'react';
import { Sparkles, Brain, Lightbulb, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../api';

export default function AIAssistantWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/ai/insights');
        setInsights(res.data);
      } catch (err) {
        console.error("AI Assistant sync error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="h-12 w-12 bg-indigo-50 rounded-2xl"></div>
        <div className="h-4 w-32 bg-slate-100 rounded-lg"></div>
      </div>
    );
  }

  const challenge = insights.find(i => i.type === 'challenge');
  const resource = insights.find(i => i.type === 'resource');

  return (
    <div className="bg-indigo-900 rounded-3xl p-8 relative overflow-hidden shadow-xl border border-indigo-950 group h-full">
      {/* Premium Glassmorphic Overlay Backgrounds */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-80 h-80 rounded-full bg-white opacity-[0.03] blur-2xl group-hover:opacity-[0.05] transition-opacity duration-700"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-indigo-500 opacity-[0.1] blur-xl group-hover:scale-125 transition-transform duration-700"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-400/30">
               <Sparkles className="h-5 w-5 text-indigo-300" />
             </div>
             <h3 className="text-xl font-black text-white tracking-tight uppercase">AI Study Guru</h3>
          </div>
          <span className="text-[10px] font-black text-indigo-300 bg-indigo-800/50 px-3 py-1 rounded-full border border-indigo-700/50 uppercase tracking-widest leading-none">Weekly Sync</span>
        </div>

        {/* Challenge Section */}
        {challenge && (
          <div className="mb-8 p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 group/challenge shadow-inner">
             <div className="flex items-center gap-2 mb-4">
               <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
               <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] leading-none">The Weekly Challenge</h4>
             </div>
             <p className="text-xl font-extrabold text-white leading-tight mb-3 transition-colors group-hover/challenge:text-emerald-300">{challenge.title}</p>
             <p className="text-sm font-medium text-indigo-200/80 leading-relaxed max-w-sm">{challenge.content}</p>
          </div>
        )}

        {/* Resource Section */}
        {resource && (
          <div className="mt-auto flex items-center justify-between p-5 bg-indigo-950/60 rounded-3xl border border-indigo-800/50 hover:border-indigo-500 hover:bg-indigo-950 transition-all cursor-pointer group/item shadow-2xl">
             <div className="flex items-center gap-5">
               <div className="p-3 bg-indigo-800 rounded-2xl shadow-lg border border-indigo-700">
                 <Lightbulb className="h-6 w-6 text-amber-400" />
               </div>
               <div>
                  <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Expert Resource</h5>
                  <p className="text-base font-extrabold text-white leading-none">{resource.title}</p>
               </div>
             </div>
             <div className="bg-indigo-800 p-2 rounded-lg group-hover/item:bg-indigo-600 transition-colors">
               <ExternalLink className="h-4 w-4 text-indigo-300 group-hover/item:text-white" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
