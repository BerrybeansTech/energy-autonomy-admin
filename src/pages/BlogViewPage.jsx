import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal } from '../components/common';
import { uploadApi } from '../services/api';

/**
 * Clean recursive renderer for Tiptap JSON content
 */
function renderTiptapNode(node, index) {
  if (!node) return null;
  if (typeof node === 'string') return node;

  switch (node.type) {
    case 'doc':
      return (
        <div key={index} className="space-y-4">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </div>
      );
    case 'heading': {
      const level = node.attrs?.level || 2;
      const HeadingTag = `h${level}`;
      const sizeClass =
        level === 1
          ? 'text-2xl sm:text-3xl font-bold text-slate-900 mt-6 mb-3 font-lora leading-tight'
          : level === 2
          ? 'text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-2.5 font-lora leading-tight'
          : 'text-lg sm:text-xl font-bold text-slate-900 mt-4 mb-2 font-lora leading-tight';
      return (
        <HeadingTag key={index} className={sizeClass}>
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </HeadingTag>
      );
    }
    case 'paragraph': {
      if (!node.content || node.content.length === 0) {
        return <p key={index} className="h-3" />;
      }
      return (
        <p key={index} className="text-sm sm:text-base text-slate-700 leading-[1.8]">
          {node.content.map((child, i) => renderTiptapNode(child, i))}
        </p>
      );
    }
    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#8F3EC9] pl-4 py-2 my-4 italic text-slate-700 bg-purple-50/40 rounded-r-lg"
        >
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </blockquote>
      );
    case 'bulletList':
      return (
        <ul key={index} className="list-disc list-inside space-y-1.5 my-3 pl-2 text-slate-700 text-sm sm:text-base">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={index} className="list-decimal list-inside space-y-1.5 my-3 pl-2 text-slate-700 text-sm sm:text-base">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </ol>
      );
    case 'listItem':
      return (
        <li key={index} className="leading-relaxed">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </li>
      );
    case 'image': {
      const src = node.attrs?.src;
      return (
        <div key={index} className="my-6 rounded-xl overflow-hidden border border-slate-200">
          <img
            src={getBlogImage(src)}
            alt={node.attrs?.alt || 'Article visual'}
            className="w-full max-h-[520px] object-cover"
          />
        </div>
      );
    }
    case 'horizontalRule':
      return <hr key={index} className="my-6 border-slate-200" />;
    case 'text': {
      let content = node.text;
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === 'bold') {
            content = <strong key="b" className="font-bold text-slate-900">{content}</strong>;
          } else if (mark.type === 'italic') {
            content = <em key="i" className="italic">{content}</em>;
          } else if (mark.type === 'link') {
            content = (
              <a
                key="link"
                href={mark.attrs?.href}
                target="_blank"
                rel="noreferrer"
                className="text-[#8F3EC9] hover:underline font-medium"
              >
                {content}
              </a>
            );
          } else if (mark.type === 'textStyle' && mark.attrs?.color) {
            content = <span key="color" style={{ color: mark.attrs.color }}>{content}</span>;
          } else if (mark.type === 'highlight') {
            content = <mark key="mark" className="bg-yellow-100 px-1 rounded">{content}</mark>;
          }
        });
      }
      return <React.Fragment key={index}>{content}</React.Fragment>;
    }
    default:
      return (
        <div key={index}>
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </div>
      );
  }
}

const BlogViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, deletePost, updateStatus } = useBlog();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Asynchronously fetch post by ID or Slug
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const found = await getPost(id);
        if (isMounted) {
          setPost(found);
        }
      } catch (err) {
        console.error('Failed to load post:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (id) {
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [id, getPost]);

  // Track scroll on window and main container for sticky glass navbar
  useEffect(() => {
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

  const toggleStatus = async () => {
    if (!post || statusLoading) return;
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    setStatusLoading(true);
    try {
      const updated = await updateStatus(post.id, nextStatus);
      if (updated) {
        setPost(updated);
      }
    } catch (err) {
      console.error('Failed to toggle post status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deletePost(post.id);
      const img = post.featuredImage || post.image;
      if (img && (img.includes('/uploads/') || img.includes('cover-'))) {
        const fname = img.split('/').pop().split('\\').pop();
        await uploadApi.delete(fname).catch(() => {});
      }
      navigate('/blog');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-72 bg-slate-200 rounded-2xl w-full" />
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="space-y-3 pt-4">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

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
        <p className="text-sm text-slate-500 max-w-sm mx-auto">The requested article could not be located in the database.</p>
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

  const hasRichContent = post.contentJson && typeof post.contentJson === 'object' && post.contentJson.type === 'doc';

  return (
    <div className="space-y-5 relative">
      {/* ── Sticky Top Navbar ── */}
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
              disabled={statusLoading}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all bg-white shadow-2xs cursor-pointer disabled:opacity-60 ${
                post.status === 'published'
                  ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {statusLoading ? 'Updating...' : post.status === 'published' ? 'Move to Draft' : 'Publish Article'}
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
          {/* Featured Image */}
          {post.image && (
            <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden group">
              <img
                src={getBlogImage(post.image)}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              <div className="absolute top-3.5 left-3.5">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#8F3EC9] backdrop-blur-sm shadow-xs">
                  {post.category || 'General'}
                </span>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-5">
            {/* Meta Line */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-100">
              <span>Updated {post.publishedAt || 'recently'}</span>
              <span>•</span>
              <span>{post.readTime || post.readingTime || '1 min read'}</span>
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

            {/* Rich Body Content */}
            <div className="pt-2">
              {hasRichContent ? (
                renderTiptapNode(post.contentJson, 0)
              ) : (
                <div className="space-y-3.5 text-sm text-slate-700 leading-[1.8]">
                  {(post.content || '').split('\n\n').filter(Boolean).map((paragraph, index) => (
                    <p key={index} className="leading-[1.8]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Right: Sticky Sidebar (Clean Article Properties) */}
        <aside className="lg:col-span-4 space-y-5 sticky top-[72px] self-start">
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
                { label: 'URL Slug', value: post.slug || '—', isSlug: true },
                { label: 'Category', value: post.category || 'General', isCategory: true },
                { label: 'Published Date', value: post.publishedAt || 'Not published yet' },
                { label: 'Read Time', value: post.readTime || post.readingTime || '1 min read' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0 items-center gap-2">
                  <span className="text-slate-500 font-medium shrink-0">{item.label}</span>
                  <span className={`font-bold truncate text-right ${
                    item.isCategory ? 'text-[#8F3EC9]' :
                    item.isSlug ? 'text-slate-700 font-mono text-[11px]' :
                    item.isStatus ? (post.status === 'published' ? 'text-emerald-600' : 'text-amber-600') :
                    'text-slate-800'
                  } ${item.isSlug ? 'lowercase' : 'capitalize'}`}>
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
