import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { BookOpen, User, Mail, Lock, GraduationCap, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    university: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Identity enrollment failed. System offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch font-sans bg-white overflow-hidden">
      {/* Visual Wing: Recruitment Branding */}
      <div className="hidden lg:flex w-5/12 bg-indigo-950 items-center justify-center relative">
         <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900" />
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')]" />
         
         <div className="relative z-10 p-20 max-w-xl animate-card-float">
            <div className="bg-indigo-500/20 backdrop-blur-3xl border border-indigo-400/20 p-5 rounded-3xl inline-block mb-12">
               <Sparkles className="h-10 w-10 text-indigo-300" />
            </div>
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-10 tracking-tighter">
               Join the <br/>
               <span className="italic text-indigo-400 underline decoration-indigo-500/30 underline-offset-[14px]">Intelligence</span> <br/>
               Collective.
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-relaxed mb-16">
               Secure your node. Access high-precision study matching and hyper-organized group workflows.
            </p>
            
            <div className="space-y-6">
               <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md hover-lift">
                  <ShieldCheck className="h-8 w-8 text-indigo-400" />
                  <div>
                     <p className="text-xs font-black text-white uppercase tracking-[0.2em]">Validated Node</p>
                     <p className="text-[10px] text-slate-500 mt-1 font-bold">Secure academic environment.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Register Pro Card Wing */}
      <div className="w-full lg:w-7/12 bg-white flex items-center justify-center p-8 sm:p-24 relative overflow-y-auto">
        <div className="w-full max-w-2xl animate-pro-fade-in">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-12 lg:hidden">
               <div className="bg-indigo-600 p-3 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-white" />
               </div>
               <span className="text-3xl font-black text-slate-900 tracking-tight">StudyMatch</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Enrollment</h2>
            <div className="h-1.5 w-24 bg-indigo-600 rounded-full mt-6" />
          </div>

          {error && (
            <div className="mb-12 bg-rose-50/50 backdrop-blur-md border-2 border-rose-100 text-rose-600 px-8 py-5 rounded-[2.5rem] text-sm font-bold flex items-center gap-4 animate-pulse">
              <div className="h-2 w-2 bg-rose-600 rounded-full animate-ping" />
              {error}
            </div>
          )}
          
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4" onSubmit={handleSubmit}>
            <div className="floating-group group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <User className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="text"
                name="full_name"
                placeholder=" "
                required
                disabled={loading}
                onChange={handleChange}
                className="floating-input"
              />
              <label className="floating-label">Full Identity</label>
            </div>

            <div className="floating-group group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <GraduationCap className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="text"
                name="university"
                placeholder=" "
                required
                disabled={loading}
                onChange={handleChange}
                className="floating-input"
              />
              <label className="floating-label">Academic Hub</label>
            </div>

            <div className="md:col-span-2 floating-group group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <Mail className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                placeholder=" "
                required
                disabled={loading}
                onChange={handleChange}
                className="floating-input"
              />
              <label className="floating-label">Digital Address</label>
            </div>

            <div className="md:col-span-2 floating-group group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
                <Lock className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="password"
                name="password"
                placeholder=" "
                required
                disabled={loading}
                onChange={handleChange}
                className="floating-input"
              />
              <label className="floating-label">Secure Sequence</label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 group relative w-full flex justify-between items-center py-6 px-10 bg-slate-900 text-white rounded-[2.25rem] font-black text-base hover:bg-indigo-600 shadow-2xl transition-all disabled:opacity-50 hover-lift overflow-hidden mt-4"
            >
              <span className="relative z-10">{loading ? 'Synthesizing...' : 'Confirm Enrollment'}</span>
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-2 relative z-10" />
            </button>

            {/* Bottom Link: As per user request */}
            <div className="md:col-span-2 pt-10 text-center border-t border-slate-100 mt-10">
               <p className="text-slate-500 font-bold text-sm">
                  Already established? <Link to="/login" className="text-indigo-600 font-extrabold hover:underline underline-offset-[10px] decoration-4 ml-1">Authenticate Instead</Link>
               </p>
            </div>
          </form>

          <footer className="mt-20 flex justify-center">
             <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.45em]">v3.1.0 Node Enrollment</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
