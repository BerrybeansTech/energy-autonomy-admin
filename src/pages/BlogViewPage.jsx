import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal } from '../components/common';
import { uploadApi } from '../services/api';
import {
  SlidersHorizontal,
  Edit3,
  Calendar,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  Plus,
  X,
  Star,
  Bookmark,
  Code2,
  Lock,
  User,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ArrowLeft
} from 'lucide-react';

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
      const resolved = getBlogImage(src);
      if (!resolved) return null;
      return (
        <div key={index} className="my-6 rounded-xl overflow-hidden border border-slate-200">
          <img
            src={resolved}
            alt={node.attrs?.alt || 'Article visual'}
            className="w-full max-h-[520px] object-cover"
          />
        </div>
      );
    }
    case 'codeBlock':
      return (
        <pre key={index} className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-sm overflow-x-auto my-4 leading-relaxed">
          <code>{node.content?.map((child, i) => renderTiptapNode(child, i))}</code>
        </pre>
      );
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
          } else if (mark.type === 'strike') {
            content = <del key="s" className="line-through text-slate-500">{content}</del>;
          } else if (mark.type === 'code') {
            content = <code key="code" className="bg-slate-100 text-[#8F3EC9] px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono">{content}</code>;
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
            const color = mark.attrs?.color || '#fef08a';
            content = <mark key="mark" style={{ backgroundColor: color }} className="px-1 py-0.5 rounded">{content}</mark>;
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
  const { getPost, deletePost, updateStatus, updatePost } = useBlog();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ── Post Settings State (Exact fields from Publish Article popup) ──
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [postSettings, setPostSettings] = useState({
    coverImage: '',
    title: '',
    subtitle: '',
    labelName: '',
    seoTitle: '',
    seoDescription: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isSeoTitleEdited, setIsSeoTitleEdited] = useState(false);
  const [isSeoDescriptionEdited, setIsSeoDescriptionEdited] = useState(false);

  // Asynchronously fetch post by ID or Slug
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const found = await getPost(id);
        if (isMounted && found) {
          setPost(found);

          const initialTitle = found.title || '';
          const initialSubtitle = found.excerpt || found.subtitle || '';
          const initialLabel = found.label_name || found.labelName || found.categoryName || found.category || '';
          const initialCover = found.featuredImage || found.image || '';
          const initialSeoTitle = found.seoTitle || found.seo_title || initialTitle;
          const initialSeoDesc = found.seoDescription || found.seo_description || initialSubtitle;

          setPostSettings({
            coverImage: initialCover,
            title: initialTitle,
            subtitle: initialSubtitle,
            labelName: initialLabel,
            seoTitle: initialSeoTitle,
            seoDescription: initialSeoDesc,
          });
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingCover(true);
      setSaveError('');
      try {
        const res = await uploadApi.upload(file);
        const fileUrl = res.file?.url || res.file?.path;
        if (fileUrl) {
          setPostSettings((prev) => ({ ...prev, coverImage: fileUrl }));
        }
      } catch (err) {
        console.error('Failed to upload cover image:', err);
        setSaveError('Failed to upload image: ' + (err.message || 'Server error'));
      } finally {
        setUploadingCover(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveCover = () => {
    setPostSettings((prev) => ({ ...prev, coverImage: '' }));
  };

  const handleSavePostSettings = async () => {
    if (!postSettings.coverImage?.trim()) {
      setSaveError('Cover image is compulsory. Please upload a cover image for your article.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!postSettings.title?.trim()) {
      setSaveError('Title is compulsory. Please enter an article title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!postSettings.subtitle?.trim()) {
      setSaveError('Subtitle / Summary excerpt is compulsory. Please enter a subtitle.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!postSettings.labelName?.trim()) {
      setSaveError('Label Name is compulsory. Please enter a label name for your article.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSavingSettings(true);
    setSaveError('');
    try {
      const cleanTitle = postSettings.title.trim();
      const payload = {
        title: cleanTitle,
        featuredImage: postSettings.coverImage,
        labelName: postSettings.labelName.trim(),
        seoTitle: postSettings.seoTitle.trim() || cleanTitle,
        seoDescription: postSettings.seoDescription.trim() || postSettings.subtitle.trim(),
      };

      if (updatePost) {
        await updatePost(post.id, payload);
      }

      setPost((prev) => ({
        ...prev,
        ...payload,
        excerpt: postSettings.subtitle.trim(),
        subtitle: postSettings.subtitle.trim(),
        label_name: postSettings.labelName.trim(),
      }));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditSettingsOpen(false);
      }, 700);
    } catch (err) {
      console.error('Failed to save post settings:', err);
      setSaveError(err.data?.message || err.message || 'Failed to update post settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all bg-white shadow-2xs text-xs font-semibold shrink-0 cursor-pointer"
              title="Back to Blogs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Blogs</span>
            </Link>

            <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

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

          {/* Right Action Controls: Move to Draft / Publish, Post Settings toggle, Edit Content, Delete */}
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

            {/* Post Settings Toggle Button (Toggles between View Details and Edit Settings) */}
            <button
              type="button"
              onClick={() => setIsEditSettingsOpen(!isEditSettingsOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isEditSettingsOpen
                  ? 'bg-purple-50 border-purple-300 text-[#8F3EC9] font-bold ring-1 ring-purple-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#8F3EC9]'
              }`}
              title={isEditSettingsOpen ? 'Switch to View Details' : 'Edit Post Settings'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isEditSettingsOpen ? 'View Details' : 'Post Settings'}</span>
            </button>

            {/* Edit Content Button -> Navigates to full blog editor */}
            <Link
              to={`/blog/edit/${post.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              title="Edit full blog content in rich text editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </Link>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg text-xs font-semibold transition-all bg-white shadow-2xs cursor-pointer"
              title="Delete post"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Article Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Full Article */}
        <article className="lg:col-span-8 w-full bg-white rounded-xl border border-slate-200/80 overflow-hidden transition-all duration-300">
          {/* Featured Image */}
          {Boolean(getBlogImage(postSettings.coverImage || post.featuredImage || post.image)) && (
            <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden group">
              <img
                src={getBlogImage(postSettings.coverImage || post.featuredImage || post.image)}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              {(postSettings.labelName || post.label_name || post.categoryName || post.category) && (
                <div className="absolute top-3.5 left-3.5">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#8F3EC9] backdrop-blur-sm shadow-xs">
                    {postSettings.labelName || post.label_name || post.categoryName || post.category}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-5">
            {/* Meta Line */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pb-3 border-b border-slate-100">
              <span>Updated {post.publishedAt ? post.publishedAt.split('T')[0] : 'recently'}</span>
              <span>•</span>
              <span>{post.readTime || post.readingTime || '1 min read'}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold font-lora text-slate-900 leading-tight tracking-tight">
              {postSettings.title || post.title}
            </h1>

            {/* Excerpt */}
            {(postSettings.subtitle || post.excerpt) && (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8F3EC9] to-[#FE9B40] rounded-full" />
                <p className="text-sm sm:text-base text-slate-600 italic leading-relaxed bg-purple-50/40 p-4 pl-5 rounded-lg">
                  "{postSettings.subtitle || post.excerpt}"
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

        {/* ── Right: Sidebar (View Details by Default / Ghost Edit Settings on Click) ── */}
        <aside className="lg:col-span-4 space-y-4 sticky top-[72px] self-start animate-fade-in select-none">
          {!isEditSettingsOpen ? (
            /* ================= VIEW MODE: CLEAN ARTICLE PROPERTIES ================= */
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center pb-3 border-b border-slate-100">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Article Properties</span>
                </h3>
              </div>

              {/* View details table */}
              <div className="space-y-0 text-xs">
                {[
                  { label: 'Live Status', value: post.status, isStatus: true },
                  { label: 'Label Name', value: postSettings.labelName || post.label_name || post.labelName || post.categoryName || post.category || '—', isCategory: true },
                  { label: 'SEO Title', value: postSettings.seoTitle || post.seoTitle || post.seo_title || post.title || '—' },
                  { label: 'SEO Description', value: postSettings.seoDescription || post.seoDescription || post.seo_description || postSettings.subtitle || post.excerpt || '—' },
                  { label: 'Published Date', value: post.publishedAt ? post.publishedAt.split('T')[0] : 'Not published yet' },
                  { label: 'Read Time', value: post.readTime || post.readingTime || '1 min read' },
                  { label: 'Author', value: post.author || 'Energy Autonomy' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0 items-center gap-2">
                    <span className="text-slate-500 font-medium shrink-0">{item.label}</span>
                    <span className={`font-bold truncate text-right ${
                      item.isCategory ? 'text-[#8F3EC9]' :
                      item.isStatus ? (post.status === 'published' ? 'text-emerald-600' : 'text-amber-600') :
                      'text-slate-800'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          ) : (
            /* ================= EDIT MODE: EXACT POPUP FIELDS AS PUBLISH DRAWER ================= */
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-fade-in">
              {/* Settings Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Publish Article
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <span>All fields marked with</span>
                    <span className="text-rose-500 font-bold">*</span>
                    <span>are compulsory to publish</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditSettingsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Close settings (Return to View)"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Body */}
              <div className="p-5 space-y-5 text-xs">
                {/* Error Banner */}
                {saveError && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg animate-fade-in">
                    <span>{saveError}</span>
                    <button
                      type="button"
                      onClick={() => setSaveError('')}
                      className="text-red-400 hover:text-red-700 text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Save Feedback Banner */}
                {saveSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Post settings updated successfully!</span>
                  </div>
                )}

                {/* --- Section 1: Story Preview --- */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#8F3EC9]" />
                    <span>Story Preview</span>
                  </h4>

                  {/* Cover Image Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Cover Image <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {postSettings.coverImage ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 group">
                        <img
                          src={getBlogImage(postSettings.coverImage)}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                            title="Remove Cover Image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-xl text-center hover:bg-purple-50/20 hover:border-purple-300 transition-all">
                        {uploadingCover ? (
                          <div className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#8F3EC9]">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Uploading image...</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer block py-1">
                            <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-semibold text-[#8F3EC9] hover:underline block">
                              Upload a cover image
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Recommended: 16:9 high resolution image
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={postSettings.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostSettings((prev) => ({
                          ...prev,
                          title: val,
                          ...(!isSeoTitleEdited ? { seoTitle: val } : {}),
                        }));
                        if (saveError) setSaveError('');
                      }}
                      placeholder="Article title..."
                      className="w-full px-3 py-2 bg-white text-xs font-bold text-slate-900 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all"
                    />
                  </div>

                  {/* Subtitle / Summary Excerpt */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subtitle / Summary Excerpt <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={postSettings.subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostSettings((prev) => ({
                          ...prev,
                          subtitle: val,
                          ...(!isSeoDescriptionEdited ? { seoDescription: val } : {}),
                        }));
                        if (saveError) setSaveError('');
                      }}
                      placeholder="Write a brief subtitle or summary for readers..."
                      className="w-full px-3 py-2 text-xs text-slate-700 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none resize-none leading-relaxed transition-all"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* --- Section 2: Label Settings --- */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-[#8F3EC9]" />
                    <span>Label Settings</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Label Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={postSettings.labelName}
                      onChange={(e) => {
                        setPostSettings((prev) => ({ ...prev, labelName: e.target.value }));
                        if (saveError) setSaveError('');
                      }}
                      placeholder="Enter label name (e.g. ENERGY & AWARENESS)..."
                      className="w-full px-3 py-2 bg-white text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      The primary topic label displayed on the article card and page.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* --- Section 3: SEO Settings --- */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#8F3EC9]" />
                      <span>SEO Settings</span>
                    </h4>
                    {(isSeoTitleEdited || isSeoDescriptionEdited) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSeoTitleEdited(false);
                          setIsSeoDescriptionEdited(false);
                          setPostSettings((prev) => ({
                            ...prev,
                            seoTitle: prev.title,
                            seoDescription: prev.subtitle,
                          }));
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#8F3EC9] cursor-pointer"
                        title="Reset SEO fields to match title and subtitle"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset SEO</span>
                      </button>
                    )}
                  </div>

                  {/* SEO Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        SEO Title
                      </label>
                      <span className={`text-[10px] ${postSettings.seoTitle.length > 60 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                        {postSettings.seoTitle.length}/60 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={postSettings.seoTitle}
                      onChange={(e) => {
                        setPostSettings((prev) => ({ ...prev, seoTitle: e.target.value }));
                        setIsSeoTitleEdited(true);
                        if (saveError) setSaveError('');
                      }}
                      placeholder="Enter SEO meta title..."
                      className="w-full px-3 py-2 bg-white text-xs font-semibold text-slate-900 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Title tag displayed in search engine results and browser tabs.
                    </p>
                  </div>

                  {/* SEO Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        SEO Description
                      </label>
                      <span className={`text-[10px] ${postSettings.seoDescription.length > 160 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                        {postSettings.seoDescription.length}/160 chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={postSettings.seoDescription}
                      onChange={(e) => {
                        setPostSettings((prev) => ({ ...prev, seoDescription: e.target.value }));
                        setIsSeoDescriptionEdited(true);
                        if (saveError) setSaveError('');
                      }}
                      placeholder="Enter SEO meta description..."
                      className="w-full px-3 py-2 text-xs text-slate-700 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] outline-none resize-none leading-relaxed transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Summary snippet displayed beneath your page title in Google search results.
                    </p>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSettingsOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePostSettings}
                    disabled={isSavingSettings}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8F3EC9] hover:bg-[#7B2EB3] disabled:opacity-75 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                  >
                    {isSavingSettings ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Post Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
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
