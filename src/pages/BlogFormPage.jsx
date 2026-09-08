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
    if (mode === 'edit' && id) {
      const post = getPost(id);
      if (post) {
        setForm({
          ...post,
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
        });
      }
    }
  }, [mode, id]);

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
    if (!form.excerpt.trim()) errs.excerpt = 'Excerpt is required.';
    if (!form.content.trim()) errs.content = 'Post body content is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (mode === 'create') {
      addPost(payload);
    } else {
      updatePost(Number(id), payload);
    }

    setSaved(true);
    setTimeout(() => navigate('/blog'), 900);
  };

  const insertFormatting = (prefix, suffix = '') => {
    setForm((prev) => ({
      ...prev,
      content: prev.content + `\n${prefix}Text${suffix}\n`,
    }));
  };

  const imageOptions = Object.keys(BLOG_IMAGES);

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
              <span className="text-slate-600">{mode === 'create' ? 'Create' : 'Edit'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-2xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            {mode === 'create' ? 'Publish Article' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Post saved successfully! Redirecting to Blog Library…
        </div>
      )}

      {/* ── Main Form Layout ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 cols: Editor */}
        <div className="lg:col-span-8 space-y-6">
          {/* Title & Slug */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Post Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="e.g. Recognizing What Drains Your Energy"
                className={`w-full px-4 py-3 border rounded-xl text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] transition-all ${
                  errors.title ? 'border-red-400 bg-red-50/20' : 'border-gray-200 bg-gray-50/30'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Permalink Slug
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-600">
                <span className="text-gray-400 select-none">/blog/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="post-slug"
                  className="bg-transparent border-0 flex-1 focus:outline-none text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Excerpt / Summary <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-gray-400">{form.excerpt.length} characters</span>
            </div>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => {
                setForm({ ...form, excerpt: e.target.value });
                setErrors({ ...errors, excerpt: '' });
              }}
              placeholder="A brief summary shown in article cards and search results…"
              className={`w-full p-4 border rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] transition-all resize-none ${
                errors.excerpt ? 'border-red-400 bg-red-50/20' : 'border-gray-200 bg-gray-50/30'
              }`}
            />
            {errors.excerpt && <p className="text-xs text-red-500 mt-1 font-medium">{errors.excerpt}</p>}
          </div>

          {/* Body Content with Formatting Toolbar */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Article Body <span className="text-red-500">*</span>
              </label>

              {/* Toolbar Buttons */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="px-2 py-1 rounded text-xs font-black text-gray-600 hover:bg-white hover:text-gray-900"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="px-2 py-1 rounded text-xs italic font-serif text-gray-600 hover:bg-white hover:text-gray-900"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  className="px-2 py-1 rounded text-xs font-bold text-gray-600 hover:bg-white hover:text-gray-900"
                  title="Heading 3"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-white hover:text-gray-900"
                  title="Quote"
                >
                  “ Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('• ')}
                  className="px-2 py-1 rounded text-xs text-gray-600 hover:bg-white hover:text-gray-900"
                  title="Bullet list"
                >
                  • List
                </button>
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
              className={`w-full p-4 border rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9] transition-all leading-relaxed ${
                errors.content ? 'border-red-400 bg-red-50/20' : 'border-gray-200 bg-gray-50/30'
              }`}
            />
            {errors.content && <p className="text-xs text-red-500 mt-1 font-medium">{errors.content}</p>}
          </div>

          {/* Search Result Preview */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Search Result Preview
            </h3>
            <div className="space-y-1">
              <span className="text-xs text-gray-400 block font-mono">
                https://energyautonomy.com/blog/{form.slug || 'slug'}
              </span>
              <h4 className="text-base font-bold text-[#8F3EC9] hover:underline cursor-pointer">
                {form.title || 'Untitled Post'} | Energy Autonomy
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2">
                {form.excerpt || 'Your post excerpt will appear here to summarize what readers will discover in this article…'}
              </p>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Settings Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Featured Image Selector with Live Thumbnail Preview */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Featured Image
              </label>
              <span className="text-[10px] uppercase font-bold text-[#8F3EC9] bg-purple-50 px-2 py-0.5 rounded">
                Frontend Asset
              </span>
            </div>

            {/* Live Visual Preview */}
            <div className="rounded-xl overflow-hidden border border-gray-200 aspect-[16/10] bg-gray-100 relative group">
              <img
                src={getBlogImage(form.image)}
                alt="Featured preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                Selected: {form.image}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Select Frontend Asset Reference:
              </label>
              <select
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              >
                {imageOptions.map((key) => (
                  <option key={key} value={key}>
                    {BLOG_IMAGES[key]?.label || key}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Click Thumbnail Strip */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-gray-400 block mb-2">
                Quick switch image:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {imageOptions.slice(0, 6).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, image: key })}
                    className={`rounded-lg overflow-hidden border-2 aspect-[4/3] relative ${
                      form.image === key ? 'border-[#8F3EC9] ring-2 ring-purple-200' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={BLOG_IMAGES[key].src} alt={key} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Publishing Controls */}
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Publishing Options
            </h3>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Post Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              >
                <option value="published">🟢 Published (Live)</option>
                <option value="draft">🟡 Draft (Hidden)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              />
            </div>

            {/* Read Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Estimated Read Time</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                placeholder="e.g. 5 min read"
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tags (comma separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="energy, awareness, self-care"
                className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
              />
              {form.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.split(',').map((t, idx) => {
                    const tag = t.trim();
                    if (!tag) return null;
                    return (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-[#8F3EC9] text-[10px] font-bold">
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
