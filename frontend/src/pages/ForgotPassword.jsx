import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Endpoint created in previous step
      await api.post(`/auth/forgot-password?email=${email}`);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send recovery link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Login account
        </Link>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recovery Portal</h2>
        <p className="mt-2 text-sm text-slate-600 font-medium">Verify your email to reset your study account.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200/50 sm:rounded-3xl rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-rose-500" />
          
          {submitted ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                 <div className="bg-emerald-50 p-4 rounded-full border border-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                 </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instructions Sent</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                If <span className="font-bold text-slate-700">{email}</span> is registered, you will receive a reset link shortly.
              </p>
              <Link to="/login" className="mt-8 block w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all text-center">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
                  {error}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email System</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="you@university.edu"
                      value={email}
                      disabled={loading}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Processing...' : 'Send Recovery Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
