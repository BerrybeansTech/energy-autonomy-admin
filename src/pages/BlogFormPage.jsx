import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { categories } from '../data/blogData';
import { BLOG_IMAGES, getBlogImage } from '../data/imageAssets';

const BlogFormPage = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addPost, updatePost, getPost } = useBlog();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: categories[0],
    status: 'draft',
    author: 'Pavani',
    readTime: '5 min read',
    tags: 'energy, awareness',
    image: 'blog1',
  });

  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    if (mode === 'edit' && id && getPost) {
      getPost(id).then((post) => {
        if (isMounted && post) {
          setForm({
            ...post,
            tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
          });
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [mode, id, getPost]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug && mode === 'edit' ? prev.slug : generateSlug(val),
    }));
    setErrors((prev) => ({ ...prev, title: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Article title is required.';
    if (!form.slug.trim()) errs.slug = 'URL slug is required.';
    if (!form.excerpt.trim()) errs.excerpt = 'Excerpt is required.';
    if (!form.content.trim()) errs.content = 'Content is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (mode === 'create') {
        await addPost(payload);
      } else {
        await updatePost(id, payload);
      }

      setSaved(true);
      setTimeout(() => navigate('/blog'), 900);
    } catch (err) {
      console.error('Failed to save post:', err);
      setErrors((prev) => ({ ...prev, submit: err.message || 'Failed to save.' }));
    }
  };

  const insertFormatting = (prefix, suffix = '') => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + `\n${prefix}Text${suffix}\n`,
    }));
  };

  const imageOptions = Object.keys(BLOG_IMAGES);

  const wordCount = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;

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
              {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            {mode === 'create' ? 'Publish Article' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-scale-in">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Post saved successfully! Redirecting to Blog Library…
        </div>
      )}

      {/* ── Rich Editor Banner ── */}
      <Link
        to="/write-blog"
        className="block p-4 bg-gradient-to-r from-purple-900 via-slate-900 to-purple-950 border border-purple-500/30 rounded-xl text-white shadow-md hover:border-purple-400/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-0 animate-shimmer opacity-20" />
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                  Rich Story Editor
                </span>
                <span className="text-[11px] text-purple-200/80 font-medium">Rich Story Format</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 group-hover:text-purple-200 transition-colors">
                Open Rich Story Editor
              </h3>
            </div>
          </div>
          <div className="shrink-0 hidden sm:block">
            <span className="px-3.5 py-2 bg-[#8F3EC9] group-hover:bg-[#7B2EB3] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all">
              Open Editor
            </span>
          </div>
        </div>
      </Link>

      {/* ── Main Form Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 space-y-5">
          {/* Title & Slug Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Post Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. Recognizing What Drains Your Energy"
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all ${
                  errors.title ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
                }`}
              />
              {errors.title && <p className="text-[11px] text-red-500 mt-1 font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {errors.title}
              </p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Permalink Slug
              </label>
              <div className="flex items-center bg-slate-50/80 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-600">
                <span className="text-slate-400 select-none">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="post-slug"
                  className="bg-transparent border-0 flex-1 focus:outline-none text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Excerpt Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Excerpt / Summary <span className="text-red-500">*</span>
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                form.excerpt.length > 200 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {form.excerpt.length} characters
              </span>
            </div>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => {
                setForm({ ...form, excerpt: e.target.value });
                setErrors({ ...errors, excerpt: '' });
              }}
              placeholder="A brief summary shown in article cards and search results…"
              className={`w-full p-3.5 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all resize-none ${
                errors.excerpt ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}
            />
            {errors.excerpt && <p className="text-[11px] text-red-500 mt-1 font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errors.excerpt}
            </p>}
          </div>

          {/* Body Content Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Article Body <span className="text-red-500">*</span>
              </label>

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                {[
                  { label: 'B', title: 'Bold', action: () => insertFormatting('**', '**'), className: 'font-black' },
                  { label: 'I', title: 'Italic', action: () => insertFormatting('*', '*'), className: 'italic font-serif' },
                  { label: 'H3', title: 'Heading 3', action: () => insertFormatting('### '), className: 'font-bold' },
                  { label: '" Quote', title: 'Quote', action: () => insertFormatting('> '), className: '' },
                  { label: '• List', title: 'Bullet list', action: () => insertFormatting('• '), className: '' },
                ].map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={btn.action}
                    className={`px-2 py-1.5 rounded-md text-xs text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all ${btn.className}`}
                    title={btn.title}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={14}
              value={form.content}
              onChange={(e) => {
                setForm({ ...form, content: e.target.value });
                setErrors({ ...errors, content: '' });
              }}
              placeholder="Write the full narrative of the post here. Supports multiple paragraphs…"
              className={`w-full p-3.5 border rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all leading-relaxed ${
                errors.content ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}
            />

            {/* Word count footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              {errors.content ? (
                <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.content}
                </p>
              ) : (
                <span>{wordCount} words</span>
              )}
              <span>≈ {Math.max(1, Math.ceil(wordCount / 200))} min read</span>
            </div>
          </div>

        </div>

        {/* Right Column: Settings Sidebar */}
        <div className="lg:col-span-4 space-y-5 animate-slide-in-right">
          {/* Featured Image Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Featured Image
              </label>
              <span className="text-[9px] uppercase font-bold text-[#8F3EC9] bg-purple-50 px-1.5 py-0.5 rounded-md">
                Frontend Asset
              </span>
            </div>

            {/* Live Preview */}
            <div className="rounded-lg overflow-hidden border border-slate-200 aspect-[16/10] bg-slate-100 relative group">
              <img
                src={getBlogImage(form.image)}
                alt="Featured preview"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                <span className="text-white text-[10px] font-bold bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-md">
                  {form.image}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Select Frontend Asset Reference:
              </label>
              <select
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                {imageOptions.map((key) => (
                  <option key={key} value={key}>
                    {BLOG_IMAGES[key]?.label || key}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Switch Thumbnails */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                Quick switch image:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {imageOptions.slice(0, 6).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, image: key })}
                    className={`rounded-lg overflow-hidden border-2 aspect-[4/3] relative transition-all duration-200 hover:scale-105 ${
                      form.image === key ? 'border-[#8F3EC9] ring-2 ring-purple-200 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img src={BLOG_IMAGES[key].src} alt={key} className="w-full h-full object-cover" />
                    {form.image === key && (
                      <div className="absolute inset-0 bg-[#8F3EC9]/10 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-[#8F3EC9]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Publishing Controls Card */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 space-y-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Publishing Options
            </h3>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Post Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                <option value="published">🟢 Published (Live)</option>
                <option value="draft">🟡 Draft (Hidden)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all"
              />
            </div>

            {/* Read Time */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Estimated Read Time</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                placeholder="e.g. 5 min read"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="energy, awareness, self-care"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] transition-all"
              />
              {form.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tags.split(',').map((t, idx) => {
                    const tag = t.trim();
                    if (!tag) return null;
                    return (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-[#8F3EC9] text-[10px] font-bold border border-purple-100/60">
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogFormPage;
