import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No recovery token found. Please check your email link or request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Verification failed: Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Security requirement: Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // POST to the new backend endpoint we implemented
      await api.post(`/auth/reset-password?token=${token}&new_password=${password}`);
      setSuccess(true);
      // Premium redirect delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password. The security token may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center mb-6">
           <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100">
              <ShieldCheck className="h-8 w-8 text-white" />
           </div>
        </div>
        <h2 className="text-center text-4xl font-black text-slate-900 tracking-tight">New Security Key</h2>
        <p className="mt-3 text-center text-sm text-slate-500 font-medium">Finalize your account recovery by setting a new password.</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-12 px-10 shadow-3xl shadow-slate-200/60 sm:rounded-[40px] rounded-3xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          
          {success ? (
            <div className="text-center py-6">
              <div className="flex justify-center mb-8">
                 <div className="bg-emerald-50 p-6 rounded-full border-4 border-emerald-100">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                 </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Password Restored</h3>
              <p className="text-slate-500 font-bold mb-8 transition-opacity">Redirecting you to the Secure Hub...</p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-full" style={{ width: '100%', transition: 'width 3s ease-in' }} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-rose-50 border-2 border-rose-100 text-rose-600 p-5 rounded-2xl flex items-start gap-3 transition-all">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-black italic">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      disabled={loading || !token}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-14 pr-4 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Verify Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      disabled={loading || !token}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-14 pr-4 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="group relative w-full flex justify-center py-5 px-6 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-indigo-600 shadow-2xl transition-all disabled:opacity-50 active:scale-95 overflow-hidden"
              >
                {loading ? 'Securing Account...' : 'Initialize New Password'}
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform uppercase" />
              </button>
            </form>
          )}
        </div>
      </div>
      
      <div className="mt-12 text-center px-4">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
           Recovery Node &bull; AES-256 Symmetric Encryption
         </p>
      </div>
    </div>
  );
}
