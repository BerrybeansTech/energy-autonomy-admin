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
    await new Promise((r) => setTimeout(r, 500));
    const success = login(email, password);
    setLoading(false);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-white flex flex-col justify-center items-center px-4 py-10 select-none">
      {/* Top Left Corner Linear Gradient */}
      <div
        className="absolute -top-28 -left-28 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{ background: 'linear-gradient(302.04deg, #FE9B40 47.96%, #FB7787 81.49%)' }}
      />

      {/* Right Side Vertical Full-Height Center Radial Gradient */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -right-32 sm:-right-20 w-[450px] sm:w-[600px] h-full min-h-screen pointer-events-none opacity-80"
        style={{
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(252, 200, 164, 0.7) 0%, rgba(252, 200, 164, 0) 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[390px] mx-auto">
        {/* Brand Icon / Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-md shadow-purple-500/15">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#1e2329] tracking-tight">
            Log in to your account
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mt-1.5">
            Energy Autonomy Admin Panel
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-2.5 bg-red-50/90 border border-red-200 text-red-600 text-xs px-4 py-3 rounded-xl animate-fade-in">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username field */}
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-medium text-[#2d3139] mb-1.5"
            >
              Email or username
            </label>
            <input
              id="email"
              type="text"
              required
              value={email}
              onClick={() => {
                if (!email) {
                  setEmail('admin@gmail.com');
                  if (!password) setPassword('admin@123');
                  if (error) setError('');
                }
              }}
              onFocus={() => {
                if (!email) {
                  setEmail('admin@gmail.com');
                  if (!password) setPassword('admin@123');
                  if (error) setError('');
                }
              }}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="Email or username"
              className="w-full px-3.5 py-3 bg-white text-[14px] text-[#1e2329] placeholder-[#9ca3af] rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all duration-150"
            />
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#2d3139]"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onClick={() => {
                  if (!password) {
                    setPassword('admin@123');
                    if (!email) setEmail('admin@gmail.com');
                    if (error) setError('');
                  }
                }}
                onFocus={() => {
                  if (!password) {
                    setPassword('admin@123');
                    if (!email) setEmail('admin@gmail.com');
                    if (error) setError('');
                  }
                }}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-11 py-3 bg-white text-[14px] text-[#1e2329] placeholder-[#9ca3af] rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1e2329] p-1 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="3" strokeWidth={1.75} />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] text-white font-semibold rounded-xl text-[14px] shadow-xs hover:shadow transition-colors duration-200 disabled:opacity-85 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-[12px] text-slate-400">
            © {new Date().getFullYear()} Energy Autonomy. Admin Portal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

