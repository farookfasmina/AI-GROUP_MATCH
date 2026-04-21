import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { UserCircle, GraduationCap, Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { currentUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    full_name: '',
    university: '',
    department: '',
    academic_year: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (currentUser) {
       setFormData({
         full_name: currentUser.full_name || '',
         university: currentUser.university || '',
         department: currentUser.department || '',
         academic_year: currentUser.academic_year || ''
       });
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/users/me', formData);
      setMessage({ type: 'success', text: 'Profile updated successfully in the system!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pt-24 md:pl-64">
          <div className="max-w-4xl mx-auto pb-12">
            
            <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
               {/* Decorative Background Elements */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               
               <div className="flex items-center gap-6 mb-10 relative z-10 border-b border-slate-100 pb-10">
                  <div className="h-24 w-24 rounded-[1.5rem] bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center shadow-sm">
                     <UserCircle className="h-12 w-12 text-indigo-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Platform Profile</h1>
                    <p className="text-slate-600 font-medium">Update your core demographic variables.</p>
                  </div>
               </div>

               {message && (
                 <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                   {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                   {message.text}
                 </div>
               )}

               <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Full Name */}
                   <div>
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                       Personal Name
                     </label>
                     <input 
                       type="text"
                       required
                       value={formData.full_name}
                       onChange={e => setFormData({...formData, full_name: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900"
                       placeholder="e.g. Taylor Brooks"
                     />
                   </div>

                   {/* Email (Read Only representation) */}
                   <div>
                     <label className="block text-sm font-extrabold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                       Account Email
                     </label>
                     <input 
                       type="text"
                       disabled
                       value={currentUser?.email || ''}
                       className="w-full bg-slate-100 border border-slate-200 text-slate-500 px-5 py-4 rounded-2xl cursor-not-allowed font-medium opacity-70"
                     />
                     <p className="mt-2 text-xs font-bold text-slate-400">Emails act as secure identifiers and cannot be altered.</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                   
                   {/* University */}
                   <div>
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                       <Building2 className="h-4 w-4 text-indigo-500" />
                       University Name
                     </label>
                     <input 
                       type="text"
                       required
                       value={formData.university}
                       onChange={e => setFormData({...formData, university: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900"
                       placeholder="e.g. State University"
                     />
                   </div>

                   {/* Department */}
                   <div>
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                       Department
                     </label>
                     <input 
                       type="text"
                       required
                       value={formData.department}
                       onChange={e => setFormData({...formData, department: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900"
                       placeholder="e.g. Computer Science"
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   
                   {/* Academic Year (Free Text Field per user request) */}
                   <div className="col-span-1 border-r border-slate-100 pr-0 md:pr-8">
                     <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                       <GraduationCap className="h-4 w-4 text-emerald-500" />
                       Academic Year Status
                     </label>
                     <input 
                       type="text"
                       required
                       value={formData.academic_year}
                       onChange={e => setFormData({...formData, academic_year: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-900"
                       placeholder="e.g. Freshman, Final Year, Graduate"
                     />
                     <p className="mt-3 text-xs font-bold text-slate-500 leading-relaxed">
                       Specify how far along you are in your studies. We use this loosely to filter match maturities.
                     </p>
                   </div>
                 </div>

                 <div className="flex justify-end pt-8 mt-4 border-t border-slate-100">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-8 py-4 rounded-2xl text-white font-extrabold bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all disabled:opacity-50 text-lg"
                    >
                      {saving ? 'Syncing to Database...' : 'Save Profile Settings'}
                    </button>
                 </div>
               </form>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
