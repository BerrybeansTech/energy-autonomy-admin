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

const App = () => {
  return (
    <BrowserRouter>
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