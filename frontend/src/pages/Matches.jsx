import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MatchCard from '../components/MatchCard';
import SessionModal from '../components/SessionModal';
import api from '../api';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scheduling Modal State
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [schedulingGroup, setSchedulingGroup] = useState(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const response = await api.get('/matches/me');
        setMatches(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Network error: Failed to connect to matchmaking service.");
      } finally {
        setLoading(false);
      }
    };
    
    loadMatches();
  }, []);

  const handleConnect = async (targetId) => {
    try {
      await api.post(`/matches/${targetId}/connect`);
      return true; // Success for the card state
    } catch (err) {
      alert(err.response?.data?.detail || "Connection failed.");
      return false;
    }
  };

  const handleScheduleRequest = async (match) => {
    try {
      // First, ensure a private 1-on-1 group exists for this match
      const response = await api.post(`/matches/${match.target_user_id}/init-private-group`);
      const { group_id, name } = response.data;
      
      setSchedulingGroup({ id: group_id, name: name });
      setSessionModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to initialize scheduling session.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 pt-24 md:pl-64">
          <div className="max-w-5xl mx-auto pb-12">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">My Top Matches</h1>
            <p className="text-slate-600 font-medium mb-8">Calculated by our AI engine based on subjects, availability, and learning style.</p>
            
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-5 py-4 rounded-xl text-sm font-bold shadow-sm">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-slate-500 font-medium text-sm">Running matchmaking algorithm...</span>
              </div>
            ) : matches.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {matches.map(m => (
                  <MatchCard 
                    key={m.target_user_id} 
                    match={m} 
                    onConnect={handleConnect}
                    onSchedule={handleScheduleRequest}
                  />
                ))}
              </div>
            ) : !error ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-bold mb-2">No matches found right now.</p>
                <p className="text-slate-400 text-sm font-medium">Try updating your preferences to cast a wider net.</p>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {sessionModalOpen && (
        <SessionModal 
          isOpen={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
          groupId={schedulingGroup?.id}
          groupName={schedulingGroup?.name}
          onSessionCreated={() => alert(`Session scheduled with ${schedulingGroup.name}!`)}
        />
      )}
    </div>
  );
}
