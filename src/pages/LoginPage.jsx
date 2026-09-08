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

  const handleFillCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('admin@123');
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden p-4">
      {/* Ambient background soft glow accents from frontend palette */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] shadow-md shadow-purple-200 mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Energy Autonomy</h1>
          <p className="text-xs font-bold text-[#8F3EC9] tracking-wider uppercase mt-1">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-xs text-gray-500 mt-1">
              Enter your admin credentials to access the management dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  placeholder="admin@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
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
                  className="w-full pl-10 pr-11 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              className="w-full py-3 px-4 bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] text-white font-bold rounded-xl text-xs sm:text-sm hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:ring-offset-2 transition-all duration-150 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
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
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Hardcoded Demo Credentials:</p>
            <div className="flex items-center justify-center gap-2 text-xs font-mono bg-purple-50/60 text-[#8F3EC9] border border-purple-100 py-2 px-3 rounded-xl">
              <span>admin@gmail.com</span>
              <span className="text-gray-300">•</span>
              <span>admin@123</span>
            </div>
            <button
              type="button"
              onClick={handleFillCredentials}
              className="mt-2 text-[11px] font-bold text-[#8F3EC9] hover:underline"
            >
              Click here to auto-fill credentials
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          © 2026 Energy Autonomy. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
