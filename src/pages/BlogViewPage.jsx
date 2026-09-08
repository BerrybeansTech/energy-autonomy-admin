import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';

const BlogViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, deletePost, updatePost } = useBlog();
  const post = getPost(id);

  if (!post) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Post Not Found</h2>
        <p className="text-xs text-gray-500">The requested article could not be located in the library.</p>
        <Link
          to="/blog"
          className="inline-block px-5 py-2.5 bg-[#8F3EC9] text-white rounded-xl text-xs font-bold hover:bg-[#7B2EB3] transition-colors"
        >
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
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      deletePost(post.id);
      navigate('/blog');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ── Top Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            to="/blog"
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0 bg-white"
            title="Back to blog"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-0.5">
              <Link to="/blog" className="hover:text-[#8F3EC9]">Blog</Link>
              <span>/</span>
              <span className="text-slate-600 truncate max-w-xs">{post.title}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Article Preview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleStatus}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors bg-white ${
              post.status === 'published'
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {post.status === 'published' ? 'Move to Draft' : 'Publish Article'}
          </button>
          <Link
            to={`/blog/edit/${post.id}`}
            className="px-4 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Edit Post
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors bg-white"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Full Article Reading Experience */}
        <article className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {/* Featured Image */}
          <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
            <img
              src={getBlogImage(post.image)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-[#8F3EC9] backdrop-blur-xs shadow-xs">
                {post.category}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                  post.status === 'published'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {post.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {/* Meta Header */}
            <div className="flex items-center gap-3 text-xs text-gray-500 pb-4 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8F3EC9] to-[#FE9B40] text-white font-bold flex items-center justify-center text-xs">
                {post.author.charAt(0)}
              </div>
              <span className="font-bold text-gray-900">{post.author}</span>
              <span>•</span>
              <span>{post.publishedAt}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt Lead */}
            <p className="text-base sm:text-lg text-gray-600 italic leading-relaxed bg-purple-50/40 p-5 rounded-2xl border-l-4 border-[#8F3EC9]">
              "{post.excerpt}"
            </p>

            {/* Body Content */}
            <div className="space-y-4 text-sm sm:text-base text-gray-700 leading-relaxed pt-2">
              {post.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-400 mr-1">Tags:</span>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Right 4 cols: Article Info Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Metadata Card */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Article Properties
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Live Status</span>
                <span className="font-bold text-gray-800 capitalize">{post.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Category</span>
                <span className="font-bold text-[#8F3EC9]">{post.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Author</span>
                <span className="font-bold text-gray-800">{post.author}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Published Date</span>
                <span className="font-bold text-gray-800">{post.publishedAt}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Read Time</span>
                <span className="font-bold text-gray-800">{post.readTime}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Image Reference</span>
                <span className="font-mono text-gray-700">{post.image}.png</span>
              </div>
            </div>
          </div>

          {/* Frontend Reference Card */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Frontend Public URL
            </h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 break-all">
              /blog/{post.slug}
            </div>
            <p className="text-[11px] text-gray-400 leading-normal">
              This route matches the Energy-Autonomy customer frontend blog reader.
            </p>
          </div>

          {/* Quick Nav Card */}
          <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8F3EC9]">
              Next Actions
            </h3>
            <div className="space-y-2">
              <Link
                to={`/blog/edit/${post.id}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-purple-200 text-[#8F3EC9] text-xs font-bold hover:bg-purple-50 transition-colors shadow-2xs"
              >
                Edit This Article
              </Link>
              <Link
                to="/blog/create"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#8F3EC9] text-white text-xs font-bold hover:bg-[#7B2EB3] transition-colors shadow-xs"
              >
                Write Another Article
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogViewPage;
