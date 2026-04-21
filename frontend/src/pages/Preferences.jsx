import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import PreferenceForm from '../components/PreferenceForm';
import AvailabilityForm from '../components/AvailabilityForm';
import api from '../api';

export default function Preferences() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [initialPrefs, setInitialPrefs] = useState(null);
  const [initialAvail, setInitialAvail] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prefRes, availRes] = await Promise.all([
          api.get('/preferences/me'),
          api.get('/availability/')
        ]);
        setInitialPrefs(prefRes.data);
        setInitialAvail(availRes.data);
        setDataLoaded(true);
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("Failed to load your existing settings. Please refresh.");
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  const handleUpdate = async (data) => {
    setLoading(true);
    setError(null);
    setMsg("");
    
    try {
      await api.put('/preferences/me', data);
      setMsg("Successfully saved matchmaking preferences!");
      setTimeout(() => setMsg(""), 4000);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to update your preferences securely.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityUpdate = async (slots) => {
    setLoading(true);
    setError(null);
    setMsg("");

    try {
      await api.post('/availability/', slots);
      setMsg("Successfully saved study schedule!");
      setTimeout(() => setMsg(""), 4000);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to save study schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 pt-24 md:pl-64">
          <div className="max-w-3xl mx-auto pb-12">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Study Preferences</h1>
            <p className="text-slate-600 font-medium mb-8">Update your profile to get more accurate study group matches.</p>
            
            {/* Status Boxes */}
            {msg && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-bold shadow-sm animate-pulse">
                {msg}
              </div>
            )}
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm font-bold shadow-sm">
                {error}
              </div>
            )}
            {loading && (
              <p className="text-sm font-semibold text-indigo-600 mb-4 animate-pulse">Saving settings across servers...</p>
            )}
            
            {dataLoaded ? (
              <>
                <PreferenceForm initialData={initialPrefs} onSubmit={handleUpdate} />
                <AvailabilityForm initialData={initialAvail} onSubmit={handleAvailabilityUpdate} />
              </>
            ) : (
              <div className="flex justify-center py-12">
                <p className="text-slate-500 font-medium animate-pulse">Loading preferences...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
