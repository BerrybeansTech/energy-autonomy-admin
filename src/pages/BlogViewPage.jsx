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
    <div className="space-y-5 animate-fade-in">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/blog"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all shrink-0 bg-white"
            title="Back to blog"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Article Preview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleStatus}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all bg-white ${
              post.status === 'published'
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {post.status === 'published' ? 'Move to Draft' : 'Publish Article'}
          </button>
          <Link
            to={`/blog/edit/${post.id}`}
            className="px-4 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Edit Post
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-all bg-white"
            title="Delete post"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Article Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Full Article */}
        <article className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 overflow-hidden animate-fade-in-up">
          {/* Featured Image */}
          <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden group">
            <img
              src={getBlogImage(post.image)}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute top-3.5 left-3.5">
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#8F3EC9] backdrop-blur-sm shadow-sm">
                {post.category}
              </span>
            </div>
            <div className="absolute top-3.5 right-3.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm ${
                  post.status === 'published'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {post.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-5">
            {/* Meta Header */}
            <div className="flex items-center gap-3 text-xs text-slate-500 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8F3EC9] to-[#FE9B40] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {post.author.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm">{post.author}</span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                  <span>{post.publishedAt}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                  {post.views && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {(post.views || 0).toLocaleString()} views
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8F3EC9] to-[#FE9B40] rounded-full" />
              <p className="text-sm sm:text-base text-slate-600 italic leading-relaxed bg-purple-50/40 p-4 pl-5 rounded-lg">
                "{post.excerpt}"
              </p>
            </div>

            {/* Body Content */}
            <div className="space-y-3.5 text-sm text-slate-700 leading-[1.8] pt-1">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="leading-[1.8]">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-3 pt-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-[11px] font-bold text-slate-700">{post.likes || 0} likes</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60">
                <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-[11px] font-bold text-slate-700">{(post.views || 0).toLocaleString()} views</span>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Tags:</span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-purple-50 hover:text-[#8F3EC9] transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Right: Sidebar */}
        <aside className="lg:col-span-4 space-y-5 animate-slide-in-right">
          {/* Metadata Card */}
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
                { label: 'Author', value: post.author },
                { label: 'Published', value: post.publishedAt },
                { label: 'Read Time', value: post.readTime },
                { label: 'Image Ref', value: `${post.image}.png`, isMono: true },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className={`font-bold ${
                    item.isCategory ? 'text-[#8F3EC9]' :
                    item.isStatus ? (post.status === 'published' ? 'text-emerald-600' : 'text-amber-600') :
                    item.isMono ? 'font-mono text-slate-600' :
                    'text-slate-800'
                  } capitalize`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Frontend URL Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Frontend Public URL
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 break-all">
              /blog/{post.slug}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              This route matches the Energy-Autonomy customer frontend blog reader.
            </p>
          </div>

          {/* Quick Nav Card */}
          <div className="p-5 bg-gradient-to-br from-purple-50/80 to-violet-50/50 rounded-xl border border-purple-100/60 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8F3EC9] flex items-center gap-1.5">
              Next Actions
            </h3>
            <div className="space-y-2">
              <Link
                to={`/blog/edit/${post.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-white border border-purple-200 text-[#8F3EC9] text-xs font-bold hover:bg-purple-50 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit This Article
              </Link>
              <Link
                to="/blog/create"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#8F3EC9] text-white text-xs font-bold hover:bg-[#7B2EB3] transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Write Another Article
              </Link>
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
