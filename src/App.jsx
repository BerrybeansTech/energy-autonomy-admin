import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BlogProvider } from './context/BlogContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BlogListPage from './pages/BlogListPage';
import BlogFormPage from './pages/BlogFormPage';
import BlogViewPage from './pages/BlogViewPage';
import BlogCreatePage from './components/BlogCreatePage';
import { ScrollToTop } from './components/common';

const BlogCreateWrapper = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <BlogCreatePage onBackToDashboard={() => navigate('/blog')} />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <BlogProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

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
                  <BlogCreateWrapper />
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
            <Route
              path="/write-blog"
              element={
                <ProtectedRoute>
                  <BlogCreateWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-blog"
              element={
                <ProtectedRoute>
                  <BlogCreateWrapper />
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