import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const success = login(email, password);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fc] via-white to-[#f3f0ff] flex items-center justify-center relative overflow-hidden p-4">
      {/* Ambient floating shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-purple-200/30 to-violet-100/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tr from-orange-100/30 to-amber-100/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-100/10 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle, #8F3EC9 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-[420px] animate-fade-in-up">
        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle gradient top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40]" />

          {/* Brand Logo & Title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] shadow-lg shadow-purple-300/30 animate-pulse-glow">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Energy Autonomy</h1>
            <p className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#8F3EC9] tracking-[0.2em] uppercase mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8F3EC9] shadow-[0_0_10px_#8F3EC9] animate-pulse" />
              Admin Portal
            </p>
          </div>

          <div className="mb-6 text-center">
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Enter your credentials to access the management dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200/80 text-red-600 text-xs px-4 py-3 rounded-xl animate-scale-in">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8F3EC9] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  placeholder="Enter your email address"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/40 focus:border-[#8F3EC9] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#8F3EC9] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/40 focus:border-[#8F3EC9] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] text-white font-bold rounded-xl text-sm hover:from-[#7B2EB3] hover:to-[#8F3EC9] focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:ring-offset-2 transition-all duration-300 shadow-lg shadow-purple-300/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-300/30"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating…
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
            {/* Demo Credentials Box */}
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8F3EC9]">Demo Credentials</p>
                <p className="text-xs text-slate-700 font-mono mt-0.5">admin@gmail.com / admin@123</p>
              </div>
              <button
                type="button"
                onClick={() => { setEmail('admin@gmail.com'); setPassword('admin@123'); if (error) setError(''); }}
                className="px-3 py-1.5 bg-white hover:bg-purple-100 text-[#8F3EC9] text-[11px] font-bold rounded-xl border border-purple-200 shadow-xs transition-colors cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-gray-400 font-medium">
            © 2026 Energy Autonomy. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400">
            <button className="hover:text-[#8F3EC9] transition-colors font-medium">Privacy</button>
            <span>•</span>
            <button className="hover:text-[#8F3EC9] transition-colors font-medium">Terms</button>
            <span>•</span>
            <button className="hover:text-[#8F3EC9] transition-colors font-medium">Support</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
