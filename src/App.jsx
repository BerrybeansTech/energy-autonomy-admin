import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BlogListPage from './pages/BlogListPage';
import BlogFormPage from './pages/BlogFormPage';
import BlogViewPage from './pages/BlogViewPage';
import React, { useState, useEffect } from 'react'
import BlogCreatePage from './components/BlogCreatePage'
import {
  LayoutDashboard,
  PlusCircle,
  Zap,
  FileText,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react'

const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  // Standalone Route for /write-blog or /create-blog (No Sidebar)
  if (currentPath === '/write-blog' || currentPath === '/create-blog') {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <BlogCreatePage onBackToDashboard={() => navigate('/')} />
      </div>
    )
  }

  // Default Admin Home Route (/)
  return (
    <BrowserRouter>
      <AuthProvider>
        <BlogProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 font-extrabold fill-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Energy Autonomy Admin</h1>
            <p className="text-[11px] text-emerald-400 font-medium">Control Panel & Publisher</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/write-blog')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Write Blog (/write-blog)</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-8 space-y-8">
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-8 flex items-center justify-between">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
              Medium-Style Story Editor
            </span>
            <h2 className="text-2xl font-bold text-white">Create & Publish Blog Posts</h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Write rich blog posts with Medium formatting, custom word coloring, media embeds, and real-time JSON format export.
            </p>
          </div>

          <button
            onClick={() => navigate('/write-blog')}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xl transition-all cursor-pointer flex-shrink-0"
          >
            <span>Open /write-blog Route</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dashboard Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Articles</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">24</p>
            <p className="text-[11px] text-emerald-400 mt-2 font-medium">↑ 12% this month</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Readers</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">142,800</p>
            <p className="text-[11px] text-teal-400 mt-2 font-medium">Across all stories</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>JSON Export Specs</span>
              <Settings className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">Tiptap v2</p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Clean JSON Output</p>
          </div>
        </div>
      </main>
    </div>
  )
}

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <DashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogListPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog/create"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogFormPage mode="create" />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog/edit/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogFormPage mode="edit" />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog/view/:id"
              element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BlogViewPage />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BlogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;