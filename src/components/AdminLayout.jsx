import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBlog } from '../context/BlogContext';

const navItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'All Blogs',
    path: '/blog',
    hasBadge: true,
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    label: 'New Blog',
    path: '/blog/create',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { posts } = useBlog();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col z-40 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <span className="text-sm font-black text-slate-900 leading-tight block truncate">
              Energy Autonomy
            </span>
            <span className="text-[10px] font-bold text-[#8F3EC9] uppercase tracking-wider block">
              Admin Console
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : item.path === '/blog'
                  ? location.pathname === '/blog' || location.pathname.startsWith('/blog/view')
                  : location.pathname === '/blog/create' || location.pathname === '/write-blog' || location.pathname === '/create-blog';
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-[#8F3EC9]/12 text-[#8F3EC9]'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#8F3EC9]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.hasBadge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#8F3EC9]/15 text-[#8F3EC9]'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {posts.length}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Card & Smooth Hover Account Details */}
      <div className="p-3 border-t border-slate-100 bg-white relative group">
        <div className="p-2.5 rounded-xl bg-slate-50/80 group-hover:bg-slate-100/80 border border-slate-200/60 transition-all text-left flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#8F3EC9] to-[#FE9B40] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
              A
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">Admin</p>
              <p className="text-[11px] text-slate-400 truncate">admin@gmail.com</p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-slate-400 transition-transform duration-300 group-hover:rotate-180 group-hover:text-[#8F3EC9]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Smooth Accordion Grid Transition on Hover */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 ease-in-out">
          <div className="overflow-hidden min-h-0">
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2.5">
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">Role:</span>
                    <span className="font-bold text-[#8F3EC9]">Administrator</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-400">Email:</span>
                    <span className="font-bold text-slate-700 truncate max-w-[120px]" title="admin@gmail.com">
                      admin@gmail.com
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = () => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/blog') return 'Blog Posts';
    if (location.pathname === '/blog/create') return 'Create New Post';
    if (location.pathname.startsWith('/blog/edit')) return 'Edit Post';
    if (location.pathname.startsWith('/blog/view')) return 'View Post Preview';
    return 'Admin';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
      {/* Breadcrumb Title */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-semibold">Admin</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-bold">{getPageTitle()}</span>
      </div>
    </header>
  );
};

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <Topbar />
        <main className="flex-1 p-5 sm:p-7 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
