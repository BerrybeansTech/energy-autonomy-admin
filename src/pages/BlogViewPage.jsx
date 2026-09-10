import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal } from '../components/common';

const BlogViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, deletePost, updatePost } = useBlog();
  const post = getPost(id);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll on window and main container for sticky glass navbar
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const scrollable = document.querySelector('main') || document.querySelector('.overflow-y-auto');
      const containerScroll = scrollable ? scrollable.scrollTop : 0;
      setIsScrolled(scrollY > 40 || containerScroll > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const scrollable = document.querySelector('main') || document.querySelector('.overflow-y-auto');
    if (scrollable) {
      scrollable.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollable) {
        scrollable.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  if (!post) {
    return (
      <div className="p-16 max-w-xl mx-auto text-center space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Post Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">The requested article could not be located in the library.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F3EC9] text-white rounded-lg text-xs font-bold hover:bg-[#7B2EB3] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Return to Blog Posts
        </Link>
      </div>
    );
  }

  const tags = Array.isArray(post.tags)
    ? post.tags
    : (post.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  const toggleStatus = () => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    updatePost(post.id, { ...post, status: nextStatus });
  };

  const handleDelete = () => {
    deletePost(post.id);
    navigate('/blog');
  };

  return (
    <div className="space-y-5 relative">
      {/* ── Sticky Top Navbar (Same #FAFBFC color with glass blur, never turning white) ── */}
      <div
        className={`sticky top-0 z-30 transition-all duration-150 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-4 border-b border-slate-200/80 bg-[#FAFBFC]/85 backdrop-blur-md ${
          isScrolled ? 'shadow-[0_2px_8px_rgba(0,0,0,0.03)]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left Side: Back button + Title / Preview label */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              to="/blog"
              className="w-9 h-9 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all shrink-0 bg-white shadow-2xs cursor-pointer"
              title="Back to blog"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {!isScrolled ? (
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                Article Preview
              </h1>
            ) : (
              <h2
                className="text-sm sm:text-base font-bold font-lora text-slate-900 truncate leading-snug"
                title={post.title}
              >
                {post.title}
              </h2>
            )}
          </div>

          {/* Right Action Controls: Move to Draft / Publish, Edit Post, Delete */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleStatus}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all bg-white shadow-2xs cursor-pointer ${
                post.status === 'published'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {post.status === 'published' ? 'Move to Draft' : 'Publish Article'}
            </button>

            <Link
              to={`/blog/edit/${post.id}`}
              className="px-4 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              Edit Post
            </Link>

            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-all bg-white shadow-2xs cursor-pointer"
              title="Delete post"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Article Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Full Article */}
        <article className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 overflow-hidden">
          {/* Featured Image (No overlay badge) */}
          <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden group">
            <img
              src={getBlogImage(post.image)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute top-3.5 left-3.5">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#8F3EC9] backdrop-blur-sm shadow-xs">
                {post.category}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-5">
            {/* Meta Line: Only Updated at and min read (Avatar and author removed) */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-100">
              <span>Updated {post.publishedAt || 'recently'}</span>
              <span>•</span>
              <span>{post.readTime || '1 min read'}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold font-lora text-slate-900 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8F3EC9] to-[#FE9B40] rounded-full" />
                <p className="text-sm sm:text-base text-slate-600 italic leading-relaxed bg-purple-50/40 p-4 pl-5 rounded-lg">
                  "{post.excerpt}"
                </p>
              </div>
            )}

            {/* Body Content */}
            <div className="space-y-3.5 text-sm text-slate-700 leading-[1.8] pt-1">
              {(post.content || '').split('\n\n').filter(Boolean).map((paragraph, index) => (
                <p key={index} className="leading-[1.8]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>

        {/* Right: Sticky Sidebar (Clean Article Properties) */}
        <aside className="lg:col-span-4 space-y-5 sticky top-[72px] self-start">
          {/* Metadata Card (Author and image ref removed) */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Article Properties
            </h3>

            <div className="space-y-0 text-xs">
              {[
                { label: 'Live Status', value: post.status, isStatus: true },
                { label: 'Category', value: post.category, isCategory: true },
                { label: 'Published', value: post.publishedAt },
                { label: 'Read Time', value: post.readTime },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className={`font-bold ${
                    item.isCategory ? 'text-[#8F3EC9]' :
                    item.isStatus ? (post.status === 'published' ? 'text-emerald-600' : 'text-amber-600') :
                    'text-slate-800'
                  } capitalize`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default BlogViewPage;
