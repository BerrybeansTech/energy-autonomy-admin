import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { categories } from '../data/blogData';
import { getBlogImage } from '../data/imageAssets';

const BlogListPage = () => {
  const { posts, deletePost } = useBlog();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = posts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  const handleDelete = (id) => {
    deletePost(id);
    setDeleteConfirm(null);
  };

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Title & Primary Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Blog Posts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, edit, publish and organize your Energy Autonomy blog content.
          </p>
        </div>

        <Link
          to="/blog/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] hover:from-[#7B2EB3] hover:to-[#8F3EC9] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(143,62,201,0.2)] hover:shadow-[0_4px_15px_rgba(143,62,201,0.3)] hover:-translate-y-0.5 transition-all duration-300 w-fit shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          New Blog Post
        </Link>
      </div>

      {/* ── Unified Filter & Search Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-300 p-3 sm:p-4 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-full -z-10 opacity-50 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Status Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl w-fit">
            {[
              { id: 'all', label: 'All Posts', count: posts.length },
              { id: 'published', label: 'Published', count: publishedCount },
              { id: 'draft', label: 'Drafts', count: draftCount },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                      active
                        ? 'bg-purple-100 text-[#8F3EC9]'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">View:</span>
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Table View"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Cards Grid"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Inputs */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by article title, excerpt, or category…"
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:bg-white transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-56">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] focus:bg-white transition-all"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900">No blog posts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No posts match your current search query or filter criteria.
          </p>
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCategory('all'); }}
            className="mt-3.5 px-4 py-1.5 rounded-lg text-xs font-bold text-[#8F3EC9] bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW (Responsive, Clean, Never Cut Off) ── */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Article</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Published & Time</th>
                  <th className="py-3 px-5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Post Details (Thumbnail + Title + Excerpt) */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getBlogImage(post.image)}
                          alt={post.title}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0 max-w-sm">
                          <button
                            onClick={() => navigate(`/blog/view/${post.id}`)}
                            className="text-left font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors truncate block text-xs sm:text-sm"
                          >
                            {post.title}
                          </button>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-[#8F3EC9] border border-purple-150">
                        {post.category}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          post.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    {/* Published Date & Read Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-700 font-semibold">{post.publishedAt}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{post.readTime}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
                        <button
                          onClick={() => navigate(`/blog/view/${post.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-md transition-colors shadow-2xs"
                          title="Preview article"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/blog/edit/${post.id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#8F3EC9] hover:bg-white rounded-md transition-colors shadow-2xs"
                          title="Edit article"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(post.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md transition-colors shadow-2xs"
                          title="Delete article"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer showing count */}
          <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Showing <strong className="text-slate-700">{filtered.length}</strong> of {posts.length} posts</span>
            <span className="text-[10px] text-slate-400">Content synced with customer frontend</span>
          </div>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                  src={getBlogImage(post.image)}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-[#8F3EC9] shadow-xs">
                  {post.category}
                </span>
                <span
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                    post.status === 'published'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {post.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3
                    onClick={() => navigate(`/blog/view/${post.id}`)}
                    className="text-sm font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors cursor-pointer line-clamp-2 leading-snug"
                  >
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">{post.publishedAt}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/blog/view/${post.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg"
                      title="Preview"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate(`/blog/edit/${post.id}`)}
                      className="p-1.5 text-slate-400 hover:text-[#8F3EC9] hover:bg-slate-50 rounded-lg"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-lg"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-xl max-w-sm w-full border border-slate-200">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Blog Post?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This post will be permanently removed from the website catalog.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogListPage;
