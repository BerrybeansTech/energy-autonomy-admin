import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlog } from '../context/BlogContext';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Blog Management',
    path: '/blog',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    label: 'Write New Blog',
    path: '/blog/create',
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-[268px] bg-white flex flex-col z-40 select-none border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      {/* ── Brand Header (h-16 with border-b matching Topbar perfectly) ── */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80">
        <Link to="/dashboard" className="flex items-center gap-3 min-w-0 group">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <span className="text-[14px] font-black text-slate-900 leading-tight block truncate tracking-tight group-hover:text-[#8F3EC9] transition-colors">
              Energy Autonomy
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-[#8F3EC9] uppercase tracking-[0.14em]">
                Admin Console
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Main Navigation ── */}
      <div className="flex-1 py-5 px-3 overflow-y-auto">
        <div>
          <p className="px-3.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
            Main Menu
          </p>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : item.path === '/blog'
                  ? location.pathname === '/blog' ||
                    location.pathname.startsWith('/blog/view') ||
                    location.pathname.startsWith('/blog/edit')
                  : location.pathname === '/blog/create' || location.pathname === '/write-blog' || location.pathname === '/create-blog';
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-300 relative group overflow-hidden select-none ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-white text-slate-900 border border-purple-200/80 shadow-[0_2px_12px_rgba(143,62,201,0.06)] animate-scale-in'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 border border-transparent hover:border-slate-200/60 hover:translate-x-1 hover:shadow-2xs'
                  }`}
                >
                  {/* Continuous Ambient Shimmer on Active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8F3EC9]/8 to-transparent animate-shimmer pointer-events-none" />
                  )}

                  {/* Dynamic Light Sweep on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

                  {/* Icon Tile */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 relative ${
                      isActive
                        ? 'bg-gradient-to-br from-[#8F3EC9] via-[#9B4FD1] to-[#FE9B40] text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-200/70 group-hover:scale-105'
                        : 'bg-slate-100/90 text-slate-500 border border-slate-200/50 group-hover:bg-gradient-to-br group-hover:from-purple-50 group-hover:to-white group-hover:text-[#8F3EC9] group-hover:border-purple-200/80 group-hover:shadow-xs group-hover:scale-105'
                    }`}
                  >
                    {item.icon}
                  </div>

                  {/* Label */}
                  <span
                    className={`flex-1 tracking-tight text-[13px] whitespace-nowrap transition-colors duration-200 ${
                      isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-600 group-hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Admin User Card & Sign Out Button (Restored below sidebar properly) ── */}
      <div className="p-3 border-t border-slate-200/80 bg-white">
        <div className="p-2.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/70 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white text-xs font-black flex items-center justify-center shadow-xs">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Admin</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">admin@gmail.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer shrink-0"
            title="Sign Out"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

const Topbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageInfo = () => {
    if (location.pathname === '/dashboard') return { title: 'Dashboard', desc: 'Overview & Analytics' };
    if (location.pathname === '/blog') return { title: 'Blog Posts', desc: 'Content Management' };
    if (location.pathname === '/blog/create') return { title: 'Create Post', desc: 'New Article' };
    if (location.pathname.startsWith('/blog/edit')) return { title: 'Edit Post', desc: 'Modify Article' };
    if (location.pathname.startsWith('/blog/view')) return { title: 'Preview Post', desc: 'Article Preview' };
    return { title: 'Admin', desc: 'Management' };
  };

  const pageInfo = getPageInfo();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header
      className="h-16 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between border-b border-slate-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.02)]"
    >
      {/* ── Left: Breadcrumb ── */}
      <div className="flex items-center gap-2.5 text-[13px]">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-slate-500 hover:text-[#8F3EC9] font-semibold transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Admin</span>
        </Link>
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-bold">{pageInfo.title}</span>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#8F3EC9] border border-purple-100/80">
          {pageInfo.desc}
        </span>
      </div>

      {/* ── Right: Date & Sign Out ── */}
      <div className="flex items-center gap-3">
        {/* Date Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{currentDate}</span>
        </div>

        {/* Clean, Properly Styled Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs group"
          title="Sign Out"
        >
          <svg
            className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 flex subpixel-antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[268px]">
        <Topbar />
        <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
