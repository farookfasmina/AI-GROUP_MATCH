import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, Mail, Lock, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch font-sans bg-white overflow-hidden">
      {/* Visual Wing: Strategic Branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center relative">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
         
         {/* Animated Background Depth */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[180px] animate-pulse" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[180px] animate-pulse delay-700" />
         
         <div className="relative z-10 p-20 max-w-2xl animate-card-float">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] inline-block mb-12 shadow-2xl">
               <BookOpen className="h-12 w-12 text-indigo-400" />
            </div>
            <h1 className="text-6xl font-black text-white leading-[1.05] mb-10 tracking-tighter text-balance">
               Neural <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">Synergy</span> <br/>
               Platform.
            </h1>
            <p className="text-2xl text-slate-400 font-medium leading-relaxed mb-16 opacity-80">
               Where algorithmic precision meets collaborative ambition. Access your node in the study network.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all hover-lift">
                  <Sparkles className="h-8 w-8 text-indigo-400 mb-4" />
                  <p className="text-sm font-black text-white uppercase tracking-widest">AI Intelligence</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tighter">Optimized matching.</p>
               </div>
               <div className="p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all hover-lift">
                  <ShieldCheck className="h-8 w-8 text-emerald-400 mb-4" />
                  <p className="text-sm font-black text-white uppercase tracking-widest">Privacy Shield</p>
                  <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tighter">Secure protocols.</p>
               </div>
            </div>
         </div>
      </div>

      {/* Login Card Wing */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 sm:p-24 relative overflow-y-auto">
        <div className="w-full max-w-lg animate-pro-fade-in">
          {/* Header */}
          <div className="mb-16">
            <div className="lg:hidden flex items-center gap-4 mb-14">
              <div className="bg-indigo-600 p-2.5 rounded-2xl">
                 <BookOpen className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">StudyMatch</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Authentication</h2>
            <div className="h-1.5 w-20 bg-indigo-600 rounded-full mt-6" />
          </div>

          {error && (
            <div className="mb-12 bg-rose-50 border-2 border-rose-100 text-rose-600 px-8 py-5 rounded-[2rem] text-sm font-bold flex items-center gap-4 animate-bounce">
              <div className="h-2 w-2 bg-rose-600 rounded-full animate-ping" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="floating-group group">
              <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
                <Mail className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="email"
                required
                placeholder=" "
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="floating-input"
              />
              <label className="floating-label">Email Interface</label>
            </div>

            <div className="floating-group group">
              <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
                <Lock className="h-6 w-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input
                type="password"
                required
                placeholder=" "
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                className="floating-input"
              />
              <label className="floating-label">Security Key</label>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-between items-center py-[22px] px-10 bg-slate-900 text-white rounded-[2.25rem] font-black text-base hover:bg-indigo-600 shadow-2xl transition-all disabled:opacity-50 hover-lift overflow-hidden"
              >
                <span className="relative z-10">{loading ? 'Accessing Link...' : 'Authorize Access'}</span>
                <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-2 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </div>

            {/* Bottom Links: Move here as per User Request */}
            <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 mt-10">
              <p className="text-slate-500 font-bold text-sm">
                 New here? <Link to="/register" className="text-indigo-600 font-extrabold hover:underline underline-offset-[10px] decoration-4 ml-1">Create Profile</Link>
              </p>
              <Link 
                to="/forgot-password" 
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-[0.2em] transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100"
              >
                Lost Security Key?
              </Link>
            </div>
          </form>

          <footer className="mt-20 text-center">
             <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.45em]">
               v3.1.0 Interactive Secure Architecture
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
