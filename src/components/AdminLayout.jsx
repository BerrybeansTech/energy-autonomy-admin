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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Blog Management',
    path: '/blog',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    label: 'Write New Blog',
    path: '/blog/create',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

const Sidebar = ({ isSidebarExpanded, setIsSidebarExpanded }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white flex flex-col z-40 select-none border-r border-slate-200/80 shadow-[2px_0_16px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out overflow-x-hidden ${
        isSidebarExpanded ? 'w-[240px]' : 'w-[64px]'
      }`}
    >
      {/* ── Brand Header (Logo & Name when expanded / Open icon only when collapsed) ── */}
      <div className={`h-16 flex items-center transition-all duration-300 pt-2 ${
        isSidebarExpanded ? 'px-4 justify-between' : 'justify-center px-0'
      }`}>
        {isSidebarExpanded ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-xs">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[14.5px] font-medium text-slate-800 leading-tight block truncate whitespace-nowrap">
                Energy Autonomy
              </span>
            </div>

            {/* Collapse Sidebar Button at Far Right End */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSidebarExpanded(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-auto"
              title="Collapse Sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          /* When Collapsed: No logo/app name, ONLY show the Open Sidebar Icon button */
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsSidebarExpanded(true);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#8F3EC9] hover:bg-purple-50 transition-colors cursor-pointer"
            title="Open Sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Main Navigation (No 'Main Menu' text header) ── */}
      <div className={`flex-1 py-4 overflow-y-auto overflow-x-hidden ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
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
              <div key={item.path} className="relative group flex justify-center">
                <NavLink
                  to={item.path}
                  className={`transition-all duration-200 relative overflow-hidden select-none ${
                    isSidebarExpanded
                      ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg'
                      : 'w-10 h-10 flex items-center justify-center rounded-lg p-0'
                  } ${
                    isActive
                      ? 'bg-purple-50/80 text-[#8F3EC9] font-medium border border-purple-200/80 shadow-[0_2px_8px_rgba(143,62,201,0.06)]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-normal'
                  }`}
                >
                  {/* Continuous Ambient Shimmer on Active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8F3EC9]/8 to-transparent animate-shimmer pointer-events-none" />
                  )}

                  {/* Icon (Direct in row - no box wrapper) */}
                  <span className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-[#8F3EC9]' : 'text-slate-400 group-hover:text-slate-700'}`}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  {isSidebarExpanded && (
                    <span className="tracking-tight text-[13.5px] whitespace-nowrap overflow-hidden">
                      {item.label}
                    </span>
                  )}
                </NavLink>

                {/* Floating Tooltip in Collapsed Mode */}
                {!isSidebarExpanded && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ── Admin User Profile & Dropdown Popup ── */}
      <div className={`border-t border-slate-200/80 bg-white relative ${isSidebarExpanded ? 'p-3' : 'p-2 flex justify-center'}`}>
        {/* Popup Menu Above */}
        {isProfileOpen && isSidebarExpanded && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsProfileOpen(false)}
            />
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-scale-in origin-bottom">
              {/* User Info Header */}
              <div className="px-3.5 py-2 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white flex items-center justify-center font-medium text-sm shrink-0 shadow-2xs">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">Admin</p>
                  <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">admin@gmail.com</p>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Profile Trigger Row */}
        <button
          type="button"
          onClick={() => {
            if (!isSidebarExpanded) {
              setIsSidebarExpanded(true);
              setIsProfileOpen(true);
            } else {
              setIsProfileOpen(!isProfileOpen);
            }
          }}
          className={`rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer group ${
            isSidebarExpanded ? 'w-full flex items-center justify-between p-2' : 'w-10 h-10 flex items-center justify-center p-0'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs">
              A
            </div>
            {isSidebarExpanded && (
              <span className="text-[13px] font-normal text-slate-800 truncate">
                Admin
              </span>
            )}
          </div>
          {isSidebarExpanded && (
            <svg
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-900 flex subpixel-antialiased">
      <Sidebar isSidebarExpanded={isSidebarExpanded} setIsSidebarExpanded={setIsSidebarExpanded} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'ml-[240px]' : 'ml-[64px]'
      }`}>
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
