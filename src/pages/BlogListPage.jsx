import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal } from '../components/common';
import { uploadApi } from '../services/api';

const BlogListPage = () => {
  const { posts, deletePost, loading } = useBlog();
  const navigate = useNavigate();

  // Active Tab: 'published' as first, 'draft' as second
  const [activeTab, setActiveTab] = useState('published');
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const menuRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const publishedCount = useMemo(
    () => posts.filter((p) => p.status === 'published').length,
    [posts]
  );
  const draftCount = useMemo(
    () => posts.filter((p) => p.status === 'draft').length,
    [posts]
  );

  // Filter posts by active tab and search query
  const displayedPosts = useMemo(() => {
    return posts
      .filter((p) => p.status === activeTab)
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) ? p.tags.join(' ') : p.tags || '')
            .toLowerCase()
            .includes(q)
        );
      });
  }, [posts, activeTab, search]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = (post) => {
    const urlSlug = post.slug ? post.slug : post.id;
    const url = `${window.location.origin}/blog/view/${urlSlug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setOpenMenuId(null);
    showToast('Link copied to clipboard');
  };

  const handleEditStory = (post) => {
    setOpenMenuId(null);
    navigate(`/blog/edit/${post.id}`);
  };

  const handleDeleteBlog = async (target) => {
    if (!target) return;
    const postId = typeof target === 'object' ? target.id : target;
    const postImg = typeof target === 'object' ? target.image || target.featuredImage : null;

    try {
      await deletePost(postId);
      // Clean up uploaded image on backend if applicable
      if (postImg && (postImg.includes('/uploads/') || postImg.includes('cover-'))) {
        const filename = postImg.split('/').pop().split('\\').pop();
        await uploadApi.delete(filename).catch(() => {});
      }
      setDeleteConfirm(null);
      setOpenMenuId(null);
      showToast('Blog deleted successfully');
    } catch (err) {
      showToast('Failed to delete: ' + (err.message || 'Error'));
    }
  };

  // Format relative or standard updated time
  const getUpdatedTime = (post) => {
    if (!post.publishedAt) return 'Updated recently';
    return `Updated ${post.publishedAt}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2 px-1 sm:px-3 space-y-6 animate-fade-in text-slate-900">
      {/* ── Global Floating Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-scale-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Page Header: Title + Write Button ── */}
      <div className="flex items-center justify-between pt-2 pb-1">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Blogs
        </h1>

        <Link
          to="/blog/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Write New Blog</span>
        </Link>
      </div>

      {/* ── Tabs Navigation: Published (First), Drafts (Second) + Aligned Search ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-0 gap-4">
        <div className="flex items-center gap-6 sm:gap-8 -mb-[1px]">
          {/* Tab 1: Published */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('published');
              setOpenMenuId(null);
            }}
            className={`pb-3 pt-1 text-sm transition-all duration-150 cursor-pointer relative flex items-center gap-1.5 ${
              activeTab === 'published'
                ? 'font-bold text-slate-900 border-b-2 border-slate-900'
                : 'font-normal text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Published</span>
            <span className="text-xs text-slate-400">{publishedCount}</span>
          </button>

          {/* Tab 2: Drafts */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('draft');
              setOpenMenuId(null);
            }}
            className={`pb-3 pt-1 text-sm transition-all duration-150 cursor-pointer relative flex items-center gap-1.5 ${
              activeTab === 'draft'
                ? 'font-bold text-slate-900 border-b-2 border-slate-900'
                : 'font-normal text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Drafts</span>
            <span className="text-xs text-slate-400">{draftCount}</span>
          </button>
        </div>

        {/* Search Input (Properly centered & aligned with toolbar) */}
        <div className="relative pb-2 flex items-center">
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-[calc(50%+4px)] text-slate-400 pointer-events-none"
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
            placeholder="Search stories..."
            className="w-40 sm:w-56 pl-8 pr-7 py-1.5 text-xs bg-white hover:bg-slate-50/80 focus:bg-white border border-slate-200/70 rounded-lg focus:outline-none focus:border-[#8F3EC9]/60 transition-all font-normal placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-[calc(50%+4px)] text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Stories List ── */}
      <div className="divide-y divide-slate-200/60">
        {loading ? (
          <div className="py-8 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="py-4 px-3 flex items-center gap-4 animate-pulse">
                <div className="w-16 h-14 rounded-lg bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-2/3" />
                  <div className="h-2 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-medium">
              {search
                ? `No ${activeTab} blogs match "${search}"`
                : activeTab === 'published'
                ? 'You have no published blogs yet.'
                : 'You have no drafts in progress.'}
            </p>
            <Link
              to="/blog/create"
              className="mt-3 inline-block text-xs font-semibold text-[#8F3EC9] hover:underline"
            >
              Write your first blog →
            </Link>
          </div>
        ) : (
          displayedPosts.map((post) => {
            const isMenuOpen = openMenuId === post.id;
            return (
              <div
                key={post.id}
                className="py-4 px-2 sm:px-3 flex items-center justify-between gap-4 group transition-colors relative hover:bg-white/80 rounded-xl"
              >
                {/* Left: Thumbnail + Title + Description + Meta */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Image Thumbnail */}
                  <div
                    onClick={() => navigate(`/blog/view/${post.id}`)}
                    className="shrink-0 w-16 h-14 sm:w-20 sm:h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer group-hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    {getBlogImage(post.image || post.featuredImage) ? (
                      <img
                        src={getBlogImage(post.image || post.featuredImage)}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-50 via-slate-50 to-orange-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#8F3EC9]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0 flex-1">
                    <h2
                      onClick={() => navigate(`/blog/view/${post.id}`)}
                      className="text-[15px] sm:text-base font-bold font-lora text-slate-900 hover:text-[#8F3EC9] cursor-pointer line-clamp-1 leading-snug transition-colors"
                      title={post.title}
                    >
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 leading-normal">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Metadata line: Read time · Updated time */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>{post.readTime || '1 min read'}</span>
                      <span>·</span>
                      <span>{getUpdatedTime(post)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Three Dots Action Menu */}
                <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : post.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Story options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>

                  {/* Dropdown Popup Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-scale-in origin-top-right">
                      {/* 1. Copy link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(post)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>Copy link</span>
                      </button>

                      {/* 2. Edit story */}
                      <button
                        type="button"
                        onClick={() => handleEditStory(post)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit story</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />

                      {/* 3. Delete blog (labeled Delete blog as requested) */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          setDeleteConfirm(post);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-rose-600 hover:bg-rose-50/80 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete blog</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Confirmation Modal for Delete Blog ── */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeleteBlog(deleteConfirm)}
        title="Delete blog?"
        message="Are you sure you want to delete this blog? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        itemPreview={
          deleteConfirm && (
            <div className="flex items-center gap-3">
              {getBlogImage(deleteConfirm.image || deleteConfirm.featuredImage) ? (
                <img
                  src={getBlogImage(deleteConfirm.image || deleteConfirm.featuredImage)}
                  alt={deleteConfirm.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#8F3EC9]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {deleteConfirm.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {deleteConfirm.readTime}
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
