import { Users, BookOpen, CalendarDays, MessageSquare } from 'lucide-react';

export default function GroupCard({ group, onJoin, onViewMembers, isMember, userRole, onSchedule, onOpenChat }) {
  const isAdmin = userRole && String(userRole).toLowerCase() === 'admin';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-300 relative group overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">{group.name}</h3>
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black shadow-sm uppercase tracking-widest shrink-0 ml-4">
          {group.subject}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-6 line-clamp-2 relative z-10 leading-relaxed">{group.description}</p>
      
      {/* DEBUG LABEL - REMOVE LATER */}
      <div className="text-[10px] text-slate-400 absolute top-2 left-2 z-20">
        Role: {userRole || 'UNDEFINED'}
      </div>
      
      <div className="flex items-center justify-between border-t border-slate-100 pt-5 relative z-10">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <BookOpen className="h-4 w-4" />
          <span>Study Group</span>
        </div>
        {isMember ? (
          <div className="flex gap-2">
            <button
              onClick={onViewMembers}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Users className="h-4 w-4" />
              View Members
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onOpenChat(group); }}
              className="px-4 flex items-center justify-center bg-white text-indigo-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm scale-100 hover:scale-105 active:scale-95"
              title="Open Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); onSchedule(group); }}
                className="px-4 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 border border-indigo-500 scale-100 hover:scale-105 active:scale-95"
                title="Schedule Session"
              >
                <CalendarDays className="h-5 w-5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onJoin(group.id)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Users className="h-4 w-4" />
            Join Group
          </button>
        )}
      </div>
    </div>
  );
}
