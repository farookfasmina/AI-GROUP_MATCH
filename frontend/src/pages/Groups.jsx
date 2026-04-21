import { useEffect, useState, useContext } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GroupCard from '../components/GroupCard';
import SessionModal from '../components/SessionModal';
import ChatDrawer from '../components/ChatDrawer';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { X, Users as UsersIcon } from 'lucide-react';

export default function Groups() {
  const { user } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Track specific buttons loading UI safely
  const [joiningId, setJoiningId] = useState(null);

  // Group Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', subject: '', description: '' });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatGroup, setSelectedChatGroup] = useState(null);

  // Members Modal State
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Session Modal State
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [schedulingGroup, setSchedulingGroup] = useState(null);

  useEffect(() => {
    // Isolated network fetch block
    const loadGroups = async () => {
      setLoading(true);
      try {
        const [publicRes, meRes] = await Promise.allSettled([
          api.get('/groups'),
          api.get('/groups/me')
        ]);
        
        if (publicRes.status === 'fulfilled') {
          setGroups(publicRes.value.data);
        }
        
        if (meRes.status === 'fulfilled') {
          setMyGroups(meRes.value.data);
        } else if (user) {
          // Only show error if the user is logged in and the 'me' request failed
          console.error("Failed to load personal groups", meRes.reason);
        }
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load study groups.");
      } finally {
        setLoading(false);
      }
    };
    
    loadGroups();
  }, [user]);

  const handleJoin = async (id) => {
    setJoiningId(id);
    setError(null);
    // Explicit map to POST /groups/{id}/join
    try {
      await api.post(`/groups/${id}/join`);
      const groupToMove = groups.find(g => g.id === id);
      if (groupToMove) {
         // Inject the member role and move to My Groups
         const updatedGroup = { ...groupToMove, user_role: 'member' };
         setMyGroups([...myGroups, updatedGroup]);
         
         // Update the role in the public list as well to hide the join button
         setGroups(groups.map(g => g.id === id ? updatedGroup : g));
      }
      alert("Success! You've instantly joined the study group.");
    } catch (err) {
      // Show explicit error fallback mapping
      const msg = err.response?.data?.detail || "System Error: Failed to join group";
      alert(msg);
    } finally {
      setJoiningId(null);
    }
  };

  const handleViewMembers = async (group) => {
    setSelectedGroup(group);
    setMembersModalOpen(true);
    setMembersLoading(true);
    try {
      const response = await api.get(`/groups/${group.id}/members`);
      setGroupMembers(response.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleScheduleSession = (group) => {
    setSchedulingGroup(group);
    setSessionModalOpen(true);
  };

  const handleOpenChat = (group) => {
    setSelectedChatGroup(group);
    setIsChatOpen(true);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const response = await api.post('/groups/', newGroup);
      // Pushing to BOTH states ensures it shows in 'Public' and 'My Groups' with the admin role
      setGroups([response.data, ...groups]);
      setMyGroups([response.data, ...myGroups]);
      setIsModalOpen(false);
      setNewGroup({ name: '', subject: '', description: '' }); // Reset form
      alert("Study group created! You are now the admin.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create group. Please check connection.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative pt-24 md:pl-64">
          <div className="max-w-6xl mx-auto pb-12 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Study Groups</h1>
                <p className="text-slate-600 font-medium">Browse public groups or manage your memberships.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                disabled={loading} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:bg-indigo-700 transition outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50"
              >
                Create Group
              </button>
            </div>

            <div className="flex space-x-4 border-b border-slate-200 mb-8">
              <button
                onClick={() => setActiveTab('public')}
                className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'public' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Public Groups
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'my' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                My Groups
              </button>
            </div>
            
            {/* Visual Error Boundaries */}
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-xl text-sm font-bold shadow-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center gap-3 mt-10">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                 <span className="text-slate-500 font-medium">Syncing groups with server...</span>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {(activeTab === 'public' ? groups : myGroups).map(g => {
                    const isMember = myGroups.some(mg => mg.id === g.id);
                    return (
                      <div key={g.id} className="relative">
                         {/* Transparent block overlay simulating a localized button loading lock */}
                         {joiningId === g.id && (
                           <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-2xl">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                           </div>
                         )}
                         <GroupCard 
                           group={g} 
                           onJoin={isMember ? null : handleJoin} 
                           onViewMembers={() => handleViewMembers(g)} 
                           isMember={isMember} 
                           userRole={g.user_role || g.role}
                           onSchedule={handleScheduleSession}
                            onOpenChat={handleOpenChat}
                         />
                      </div>
                    )
                  })}
                  {(activeTab === 'public' ? groups : myGroups).length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-dashed border-slate-300">
                      {activeTab === 'public' ? "No study groups exist yet. Create the very first one!" : "You haven't joined any groups yet."}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Create Group Modal Overlay */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-extrabold text-slate-800">Create Study Group</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateGroup} className="p-6">
                  <div className="mb-5">
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Group Name</label>
                     <input 
                       required 
                       type="text" 
                       value={newGroup.name} 
                       onChange={e => setNewGroup({...newGroup, name: e.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900" 
                       placeholder="e.g. Algorithms Midterm Prep" 
                     />
                  </div>
                  <div className="mb-5">
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Subject / Course Code</label>
                     <input 
                       required 
                       type="text" 
                       value={newGroup.subject} 
                       onChange={e => setNewGroup({...newGroup, subject: e.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900" 
                       placeholder="e.g. CS301" 
                     />
                  </div>
                  <div className="mb-8">
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide">Description</label>
                     <textarea 
                       required 
                       value={newGroup.description} 
                       onChange={e => setNewGroup({...newGroup, description: e.target.value})} 
                       className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 min-h-[100px] resize-y" 
                       placeholder="What are the goals of this study group?"
                     ></textarea>
                  </div>
                  
                  <div className="flex gap-3">
                     <button type="submit" disabled={creating} className="w-full px-5 py-3.5 rounded-xl text-white font-extrabold bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-all">
                       {creating ? 'Creating Group...' : 'Initialize Group'}
                     </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Members Modal */}
          {membersModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 flex flex-col max-h-[80vh]">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-extrabold text-slate-800">{selectedGroup?.name} Members</h3>
                  <button onClick={() => setMembersModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1 shadow-sm border border-slate-200">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  {membersLoading ? (
                    <div className="flex justify-center p-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : groupMembers.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No members found.</p>
                  ) : (
                    <div className="space-y-4">
                      {groupMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 text-indigo-700 flex items-center justify-center rounded-full font-bold">
                              {m.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{m.full_name}</p>
                              <p className="text-xs text-slate-500">{m.email}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Session Creation Modal */}
          {sessionModalOpen && (
            <SessionModal 
              isOpen={sessionModalOpen}
              onClose={() => setSessionModalOpen(false)}
              groupId={schedulingGroup?.id}
              groupName={schedulingGroup?.name}
              onSessionCreated={() => alert('Session scheduled successfully!')}
            />
          )}

        </main>
        <ChatDrawer 
          group={selectedChatGroup}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}
