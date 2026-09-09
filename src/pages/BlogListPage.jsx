import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { categories } from '../data/blogData';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal, Pagination } from '../components/common';

const BlogListPage = () => {
  const { posts, deletePost, updatePost } = useBlog();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('table');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [statusToast, setStatusToast] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterCategory, sortBy]);

  // Quick toggle status between published and draft
  const handleToggleStatus = (post) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    updatePost(post.id, { ...post, status: nextStatus });
    setStatusToast(`"${post.title.slice(0, 30)}..." changed to ${nextStatus.toUpperCase()}`);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleDelete = (id) => {
    deletePost(id);
    setDeleteConfirm(null);
    setStatusToast('Article deleted successfully');
    setTimeout(() => setStatusToast(null), 3000);
  };

  // Filter & Sort Logic
  const filteredAndSortedPosts = useMemo(() => {
    let result = posts.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags && (Array.isArray(p.tags) ? p.tags.join(' ') : p.tags).toLowerCase().includes(q));

      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      if (sortBy === 'oldest') return new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [posts, search, filterStatus, filterCategory, sortBy]);

  // Paginated Posts
  const totalPages = Math.ceil(filteredAndSortedPosts.length / pageSize) || 1;
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedPosts.slice(start, start + pageSize);
  }, [filteredAndSortedPosts, currentPage, pageSize]);

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Energy Awareness':
        return 'bg-purple-50 text-[#8F3EC9] border-purple-200/60';
      case 'Leadership':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      case 'Emotional Awareness':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case 'Energy Restoration':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'Program':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Self-Leadership':
        return 'bg-sky-50 text-sky-700 border-sky-200/60';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/60';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Status Toast ── */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-scale-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{statusToast}</span>
          <button onClick={() => setStatusToast(null)} className="text-slate-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Blog Articles
            </h1>
          </div>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Manage, edit, publish, and analyze editorial content for the public portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/blog/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8F3EC9] via-[#9B4FD1] to-[#A06BC6] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            Write New Post
          </Link>
        </div>
      </div>

      {/* ── Metric Cards Bar (Clickable cards to filter status, with active visual state) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: All Posts */}
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
            filterStatus === 'all'
              ? 'border-[#8F3EC9] ring-2 ring-[#8F3EC9]/30 bg-gradient-to-br from-purple-50/70 via-white to-white shadow-sm -translate-y-0.5'
              : 'border-slate-200/80 bg-white hover:border-purple-200 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterStatus === 'all' ? 'text-[#8F3EC9]' : 'text-slate-500'
            }`}>
              All Posts
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              filterStatus === 'all'
                ? 'bg-[#8F3EC9] text-white shadow-xs scale-105'
                : 'bg-purple-50 text-[#8F3EC9] group-hover:bg-purple-100'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{posts.length}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-slate-500 font-medium">Across {categories.length} categories</p>
            {filterStatus === 'all' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#8F3EC9] bg-purple-100/90 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8F3EC9] animate-pulse" />
                Active
              </span>
            )}
          </div>
        </button>

        {/* Card 2: Published */}
        <button
          type="button"
          onClick={() => setFilterStatus('published')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
            filterStatus === 'published'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-white shadow-sm -translate-y-0.5'
              : 'border-slate-200/80 bg-white hover:border-emerald-200 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterStatus === 'published' ? 'text-emerald-700' : 'text-emerald-600'
            }`}>
              Published
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              filterStatus === 'published'
                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{publishedCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-emerald-600 font-medium">
              {posts.length > 0 ? Math.round((publishedCount / posts.length) * 100) : 0}% Live on site
            </p>
            {filterStatus === 'published' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </button>

        {/* Card 3: Drafts */}
        <button
          type="button"
          onClick={() => setFilterStatus('draft')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
            filterStatus === 'draft'
              ? 'border-amber-500 ring-2 ring-amber-500/30 bg-gradient-to-br from-amber-50/70 via-white to-white shadow-sm -translate-y-0.5'
              : 'border-slate-200/80 bg-white hover:border-amber-200 hover:shadow-xs hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterStatus === 'draft' ? 'text-amber-700' : 'text-amber-600'
            }`}>
              Drafts
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              filterStatus === 'draft'
                ? 'bg-amber-600 text-white shadow-xs scale-105'
                : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{draftCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-amber-600 font-medium">In preparation</p>
            {filterStatus === 'draft' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Active
              </span>
            )}
          </div>
        </button>

        {/* Card 4: Categories */}
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group select-none ${
            filterCategory !== 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-50/70 via-white to-white shadow-sm -translate-y-0.5'
              : 'border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs hover:-translate-y-0.5'
          }`}
          title={filterCategory !== 'all' ? 'Click to show all categories' : 'All categories'}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
              filterCategory !== 'all' ? 'text-indigo-700' : 'text-indigo-600'
            }`}>
              Categories
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              filterCategory !== 'all'
                ? 'bg-indigo-600 text-white shadow-xs scale-105'
                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
            }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{categories.length}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-indigo-600 font-medium truncate max-w-[140px]">
              {filterCategory !== 'all' ? filterCategory : 'Editorial topics'}
            </p>
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Filtered
              </span>
            )}
          </div>
        </button>
      </div>

      {/* ── Unified Main Articles Card (Search/Filter Toolbar + Content Merged) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Top Header: Search & Filter Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/70 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left Corner: Search Input */}
            <div className="relative w-full sm:w-80 md:w-96">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles by title, excerpt, tag..."
                className="w-full pl-10 pr-8 py-2 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white transition-all font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-xs"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Side: Category Filter + Sort + View Mode + Reset */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
              {/* Category Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none w-44 sm:w-48 py-2 pl-3.5 pr-8.5 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white transition-all cursor-pointer shadow-2xs"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-slate-600 hidden xl:inline-block">Sort:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none py-2 pl-3 pr-7.5 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="views">Most Views</option>
                    <option value="likes">Most Likes</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Table View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Clear Filter Tag (if active) */}
              {(search || filterCategory !== 'all' || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilterCategory('all');
                    setFilterStatus('all');
                  }}
                  className="text-[11px] font-bold text-[#8F3EC9] hover:underline px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors shrink-0 cursor-pointer"
                  title="Clear all filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Content Section: Table / Grid / Empty State ── */}
        {filteredAndSortedPosts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900">No blog posts found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No articles match your current search query or active filter criteria.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('all');
                setFilterCategory('all');
              }}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8F3EC9] hover:bg-[#7B2EB3] transition-all shadow-md shadow-purple-400/20 cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ── LUXURY TABLE VIEW (Center-aligned Actions header and buttons) ── */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-6">Article & Overview</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Readership</th>
                    <th className="py-3.5 px-4">Date</th>
                    {/* Actions column header CENTER ALIGNED */}
                    <th className="py-3.5 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-purple-50/20 transition-colors group"
                    >
                      {/* ── Article Column ── */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="relative shrink-0">
                            <img
                              src={getBlogImage(post.image)}
                              alt={post.title}
                              className="w-14 h-14 rounded-2xl object-cover bg-slate-100 border border-slate-200/80 shadow-sm group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Title & Excerpt */}
                          <div className="min-w-0 max-w-sm">
                            <h4
                              onClick={() => navigate(`/blog/view/${post.id}`)}
                              className="text-xs font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors cursor-pointer truncate"
                              title={post.title}
                            >
                              {post.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 truncate mt-0.5" title={post.excerpt}>
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-5 h-5 rounded-full bg-purple-100 text-[#8F3EC9] text-[9px] font-bold flex items-center justify-center shrink-0">
                                {post.author.charAt(0)}
                              </span>
                              <span className="text-[10px] text-slate-600 font-semibold">{post.author}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[10px] text-slate-500 font-medium">{post.readTime}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ── Category Column ── */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold border ${getCategoryColor(post.category)}`}>
                          {post.category}
                        </span>
                      </td>

                      {/* ── Status Column ── */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            post.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              post.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          {post.status === 'published' ? 'Live' : 'Draft'}
                        </span>
                      </td>

                      {/* ── Readership Column ── */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {(post.views || 0).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                            <svg className="w-3 h-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {post.likes || 0} likes
                          </div>
                        </div>
                      </td>

                      {/* ── Date Column ── */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-800">{post.publishedAt}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Editorial</div>
                      </td>

                      {/* ── ACTIONS COLUMN (Center Aligned as requested) ── */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          {/* 1. Preview Button */}
                          <button
                            onClick={() => navigate(`/blog/view/${post.id}`)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200/80 hover:border-sky-200 transition-all hover:scale-105 shadow-xs cursor-pointer"
                            title="Preview Article"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* 2. Edit Button */}
                          <button
                            onClick={() => navigate(`/blog/edit/${post.id}`)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-[#8F3EC9] border border-slate-200/80 hover:border-purple-200 transition-all hover:scale-105 shadow-xs cursor-pointer"
                            title="Edit Article"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* 3. Delete Button */}
                          <button
                            onClick={() => setDeleteConfirm(post)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 transition-all hover:scale-105 shadow-xs cursor-pointer"
                            title="Delete Article"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
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

            {/* Table Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAndSortedPosts.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
            />
          </div>
        ) : (
          /* ── GRID VIEW (Visual Cards with Pagination) ── */
          <div className="p-6 bg-slate-50/50 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Card Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={getBlogImage(post.image)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Category badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/95 text-[#8F3EC9] shadow-sm backdrop-blur-sm">
                      {post.category}
                    </span>

                    {/* Status pill */}
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                        post.status === 'published'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {post.status === 'published' ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3
                        onClick={() => navigate(`/blog/view/${post.id}`)}
                        className="text-sm font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Card Stats */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {(post.views || 0).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {post.likes || 0}
                        </span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8F3EC9] to-[#FE9B40] text-white text-[9px] font-bold flex items-center justify-center">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 font-semibold">{post.author}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/blog/view/${post.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 border border-slate-200 transition-all cursor-pointer"
                          title="Preview"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/blog/edit/${post.id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-[#8F3EC9] border border-slate-200 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(post)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* Grid View Pagination */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedPosts.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Reusable Global Confirmation Modal ── */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm.id)}
        title="Delete Article?"
        message="Are you sure you want to permanently delete this blog post? This action cannot be reversed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        itemPreview={
          deleteConfirm && (
            <div className="flex items-center gap-3.5">
              <img
                src={getBlogImage(deleteConfirm.image)}
                alt={deleteConfirm.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shrink-0 shadow-xs"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-bold text-[#8F3EC9] bg-purple-50 px-2 py-0.5 rounded-md mb-0.5">
                  {deleteConfirm.category}
                </span>
                <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                  {deleteConfirm.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  By {deleteConfirm.author} • {deleteConfirm.readTime}
                </p>
              </div>
            </div>
          )
        }
      />
    </div>
  );
};

export default BlogListPage;
