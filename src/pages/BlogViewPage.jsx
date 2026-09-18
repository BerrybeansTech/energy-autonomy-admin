import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MediumEditor from '../components/MediumEditor';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import { ConfirmationModal } from '../components/common';
import { uploadApi } from '../services/api';
import {
  Edit3,
  Calendar,
  Clock,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Globe,
  Plus,
  X,
  Bookmark,
  User,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  ExternalLink,
  Layers,
  Copy,
  Eye,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';

/**
 * Clean recursive renderer for Tiptap JSON content in Preview Mode
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
    case 'paragraph':
      return (
        <p key={index} className="my-2.5 text-slate-700 leading-relaxed text-sm sm:text-base">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </p>
      );
    case 'bulletList':
      return (
        <ul key={index} className="list-disc list-inside my-3 space-y-1 text-slate-700 text-sm sm:text-base">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={index} className="list-decimal list-inside my-3 space-y-1 text-slate-700 text-sm sm:text-base">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </ol>
      );
    case 'listItem':
      return (
        <li key={index} className="leading-relaxed">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </li>
      );
    case 'blockquote':
      return (
        <blockquote key={index} className="border-l-4 border-[#8F3EC9] pl-4 py-1 my-4 italic text-slate-600 bg-purple-50/40 rounded-r-lg">
          {node.content?.map((child, i) => renderTiptapNode(child, i))}
        </blockquote>
      );
    case 'image':
      return (
        <div key={index} className="my-5 rounded-xl overflow-hidden border border-slate-200">
          <img src={getBlogImage(node.attrs?.src)} alt={node.attrs?.alt || 'Article visual'} className="w-full h-auto object-cover max-h-96" />
          {node.attrs?.title && (
            <p className="text-center text-xs text-slate-400 py-1.5 bg-slate-50 border-t border-slate-100">{node.attrs.title}</p>
          )}
        </div>
      );
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
            content = <strong key="bold" className="font-bold text-slate-900">{content}</strong>;
          } else if (mark.type === 'italic') {
            content = <em key="italic">{content}</em>;
          } else if (mark.type === 'strike') {
            content = <s key="strike">{content}</s>;
          } else if (mark.type === 'code') {
            content = <code key="code" className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-purple-700">{content}</code>;
          } else if (mark.type === 'link') {
            content = (
              <a
                key="link"
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8F3EC9] underline font-medium hover:text-[#7B2EB3]"
              >
                {content}
              </a>
            );
          } else if (mark.type === 'textStyle') {
            const color = mark.attrs?.color;
            if (color) {
              content = <span key="color" style={{ color }}>{content}</span>;
            }
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

const extractMinutes = (val) => {
  if (!val) return '1';
  const matches = String(val).match(/\d+/);
  return matches ? matches[0] : '1';
};

const BlogViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, deletePost, updateStatus, updatePost } = useBlog();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null); // 'details' | 'meta' | null
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const drawerBodyRef = useRef(null);

  // ── Blog Details State (Title, Description, Image, Min Read, Label Name) ──
  const [blogDetails, setBlogDetails] = useState({
    title: '',
    description: '',
    image: '',
    readTime: '1',
    labelName: '',
  });

  // ── Meta Details State (SEO Title, SEO Description) ──
  const [metaDetails, setMetaDetails] = useState({
    seoTitle: '',
    seoDescription: '',
  });

  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Track scroll for sticky full-width navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const scrollable = document.querySelector('main') || document.querySelector('.overflow-y-auto');
      const containerScroll = scrollable ? scrollable.scrollTop : 0;
      setIsScrolled(scrollY > 20 || containerScroll > 20);
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

  // Lock background body scroll when sidebar drawer or delete modal is active
  useEffect(() => {
    if (drawerMode || deleteConfirm) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [drawerMode, deleteConfirm]);

  // Asynchronously fetch post by ID or Slug
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const found = await getPost(id);
        if (isMounted && found) {
          setPost(found);
          setBlogDetails({
            title: found.title || '',
            description: found.excerpt || found.subtitle || found.seoDescription || '',
            image: found.featuredImage || found.image || '',
            readTime: extractMinutes(found.readTime || found.readingTime || '1'),
            labelName: found.label_name || found.labelName || found.categoryName || found.category || '',
          });
          setMetaDetails({
            seoTitle: found.seoTitle || found.title || '',
            seoDescription: found.seoDescription || found.excerpt || found.subtitle || '',
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Image size exceeds 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      setSaveError('');
      const res = await uploadApi.upload(file);
      if (res && res.url) {
        setBlogDetails((prev) => ({ ...prev, image: res.url }));
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      setSaveError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setBlogDetails((prev) => ({ ...prev, image: '' }));
  };

  const handleSaveBlogDetails = async (e) => {
    if (e) e.preventDefault();

    if (!blogDetails.title.trim()) {
      setSaveError('Title is required. Please provide an article title.');
      if (drawerBodyRef.current) drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!blogDetails.description.trim()) {
      setSaveError('Subtitle / Summary Excerpt is required.');
      if (drawerBodyRef.current) drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!blogDetails.labelName.trim()) {
      setSaveError('Label Name is required. Please enter a label/category.');
      if (drawerBodyRef.current) drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSavingDetails(true);
    setSaveError('');
    try {
      const cleanTitle = blogDetails.title.trim();
      const cleanDesc = blogDetails.description.trim();
      const readCount = parseInt(blogDetails.readTime, 10) || 1;
      const formattedReadTime = `${readCount} min read`;
      const payload = {
        title: cleanTitle,
        featuredImage: blogDetails.image.trim(),
        labelName: blogDetails.labelName.trim(),
        readTime: formattedReadTime,
        readingTime: formattedReadTime,
      };

      if (updatePost) {
        await updatePost(post.id, payload);
      }

      setPost((prev) => ({
        ...prev,
        ...payload,
        excerpt: cleanDesc,
        subtitle: cleanDesc,
        image: blogDetails.image.trim(),
        featuredImage: blogDetails.image.trim(),
        label_name: blogDetails.labelName.trim(),
      }));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setDrawerMode(null);
      }, 900);
    } catch (err) {
      console.error('Failed to save blog details:', err);
      setSaveError(err.data?.message || err.message || 'Failed to update details');
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSaveMetaDetails = async (e) => {
    if (e) e.preventDefault();

    if (!metaDetails.seoTitle.trim()) {
      setSaveError('Meta Title is required. Please enter an SEO title.');
      if (drawerBodyRef.current) drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!metaDetails.seoDescription.trim()) {
      setSaveError('Meta Description is required. Please enter an SEO description.');
      if (drawerBodyRef.current) drawerBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSavingDetails(true);
    setSaveError('');
    try {
      const cleanSeoTitle = metaDetails.seoTitle.trim();
      const cleanSeoDesc = metaDetails.seoDescription.trim();
      const payload = {
        seoTitle: cleanSeoTitle,
        seoDescription: cleanSeoDesc,
      };

      if (updatePost) {
        await updatePost(post.id, payload);
      }

      setPost((prev) => ({
        ...prev,
        ...payload,
      }));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setDrawerMode(null);
      }, 900);
    } catch (err) {
      console.error('Failed to save meta details:', err);
      setSaveError(err.data?.message || err.message || 'Failed to update meta details');
    } finally {
      setIsSavingDetails(false);
    }
  };

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

  const handleCopyLink = () => {
    if (!post) return;
    const urlSlug = post.slug || post.id;
    const url = `${window.location.origin}/blog/view/${urlSlug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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

  // ── Clean Shimmer Skeleton Loading State ──
  if (loading) {
    return (
      <div className="space-y-6 pb-12 font-sans relative">
        {/* Sticky Shimmer Header */}
        <div className="sticky top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b border-slate-200/80 bg-[#FAFBFC]/90 backdrop-blur-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200/80 animate-pulse" />
              <div className="h-6 w-36 bg-slate-200/80 rounded-md animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Shimmer Cards Grid */}
        <div className="max-w-5xl mx-auto space-y-6 pt-2">
          {/* Box 1 Skeleton - Post Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 space-y-4 animate-pulse shadow-xs">
            <div className="flex justify-between items-center">
              <div className="h-7 w-40 bg-slate-200/80 rounded-md" />
              <div className="h-7 w-28 bg-slate-200/80 rounded-md" />
            </div>
            <div className="h-8 w-2/3 bg-slate-200/80 rounded-lg" />
            <div className="h-4 w-44 bg-slate-200/80 rounded-md" />
          </div>

          {/* Box 2 Skeleton - Edit Post */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 space-y-4 animate-pulse shadow-xs">
            <div className="h-7 w-32 bg-slate-200/80 rounded-md" />
            <div className="h-4 w-3/4 bg-slate-200/80 rounded-md" />
            <div className="flex gap-3 pt-2">
              <div className="h-9 w-28 bg-slate-200/80 rounded-lg" />
              <div className="h-9 w-32 bg-slate-200/80 rounded-lg" />
              <div className="h-9 w-32 bg-slate-200/80 rounded-lg" />
            </div>
          </div>

          {/* Box 3 Skeleton - Meta Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 space-y-4 animate-pulse shadow-xs">
            <div className="h-7 w-36 bg-slate-200/80 rounded-md" />
            <div className="h-4 w-2/3 bg-slate-200/80 rounded-md" />
            <div className="h-9 w-36 bg-slate-200/80 rounded-lg pt-2" />
          </div>

          {/* Box 4 Skeleton - Delete Post */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 space-y-4 animate-pulse shadow-xs">
            <div className="flex justify-between items-center">
              <div className="h-7 w-36 bg-slate-200/80 rounded-md" />
              <div className="h-9 w-28 bg-slate-200/80 rounded-lg" />
            </div>
            <div className="h-4 w-3/4 bg-slate-200/80 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-16 max-w-xl mx-auto text-center space-y-5 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Post Not Found</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">The requested article could not be located in the database.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8F3EC9] text-white rounded-lg text-xs font-bold hover:bg-[#7B2EB3] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Blog Posts
        </Link>
      </div>
    );
  }

  const isPublished = post.status === 'published';
  const hasRichContent = post.contentJson && typeof post.contentJson === 'object' && post.contentJson.type === 'doc';

  return (
    <div className="space-y-6 pb-12 font-sans relative">
      {/* ── Sticky Full-Width Navbar (Sticks on scroll) ── */}
      <div
        className={`sticky top-0 z-30 transition-all duration-150 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-2 border-b border-slate-200/80 bg-[#FAFBFC]/90 backdrop-blur-md ${
          isScrolled ? 'shadow-[0_2px_10px_rgba(0,0,0,0.04)]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          {/* Left: Back Button + Subtle Grey Title */}
          <div className="flex items-center gap-3 min-w-0">
            {isPreviewMode ? (
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all bg-white shadow-2xs shrink-0 cursor-pointer"
                title="Back to Overview"
                aria-label="Back to Overview"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
            ) : (
              <Link
                to="/blog"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all bg-white shadow-2xs shrink-0 cursor-pointer"
                title="Back to Blogs"
                aria-label="Back to Blogs"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </Link>
            )}

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {isPreviewMode ? 'Post Preview' : 'Post Overview'}
            </h1>
          </div>

          {/* Right: Overview/Preview Mode Switcher + Move to Draft / Publish Article Status Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isPreviewMode ? (
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0"
                title="Return to Overview Cards"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Overview</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsPreviewMode(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer shrink-0"
                title="Preview full article reader mode"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Preview</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleStatus}
              disabled={statusLoading}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs disabled:opacity-60 shrink-0 ${
                isPublished
                  ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {statusLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Updating...</span>
                </>
              ) : isPublished ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Move to Draft</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Publish Article</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Container: Mode 1 (Overview Boxes) OR Mode 2 (In-Page Reader Preview) ── */}
      <div className="max-w-5xl mx-auto space-y-6 pt-2.5 sm:pt-4">
        {/* ── Save Feedback Banner ── */}
        {saveSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-scale-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Changes saved successfully!</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 1: POST OVERVIEW (4 Clean Card Layout)                   */}
        {/* ============================================================== */}
        {!isPreviewMode ? (
          <div className="space-y-6 animate-fade-in">
            {/* ── 1. BOX 1: Post Overview Box ── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-3">
              {/* Header Row: Post Overview Title on Left, Copy Share Link on Top Right */}
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Post Overview
                </h2>

                {/* Top Right: Copy Share Link Button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs font-semibold text-xs shrink-0"
                  title="Copy shareable post link"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Share Link'}</span>
                </button>
              </div>

              {/* Blog Title with subtle grey color + font-lora styling + Status Badge */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                <h3 className="text-xl sm:text-2xl font-bold font-lora text-slate-700 leading-snug">
                  {post.title || 'Untitled Post'}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    isPublished
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              {/* Published Date directly under Post Title */}
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {post.publishedAt
                    ? `Published on ${post.publishedAt.split('T')[0]}`
                    : 'Not published yet (Draft)'}
                </span>
              </div>
            </div>

            {/* ── 2. BOX 2: Edit Post Box ── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Edit Post
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Make changes to your post content, title, tags, or cover image.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Button 1: Edit Post (Primary blue button) */}
                <Link
                  to={`/blog/edit/${post.id}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                  title="Edit full blog content in rich-text editor"
                >
                  <span>Edit Post</span>
                </Link>

                {/* Button 2: Preview Post Button (Switches to in-page reader preview) */}
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                  title="Preview article in full reader mode on this page"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Preview Post</span>
                </button>

                {/* Button 3: Edit Details Button (Opens smooth wide sidebar drawer) */}
                <button
                  type="button"
                  onClick={() => {
                    setBlogDetails({
                      title: post.title || '',
                      description: post.excerpt || post.subtitle || post.seoDescription || '',
                      image: post.featuredImage || post.image || '',
                      readTime: extractMinutes(post.readTime || post.readingTime || '1'),
                      labelName: post.label_name || post.labelName || post.categoryName || post.category || '',
                    });
                    setSaveError('');
                    setDrawerMode('details');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                  title="Edit title, description, cover image, read time, and label name"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>

            {/* ── 3. BOX 3: Meta Details Box ── */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Meta Details
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Manage meta title and description for search engine optimization and preview snippets.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMetaDetails({
                      seoTitle: post.seoTitle || post.title || '',
                      seoDescription: post.seoDescription || post.excerpt || post.subtitle || '',
                    });
                    setSaveError('');
                    setDrawerMode('meta');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] active:bg-[#312E81] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                  title="Open sidebar to edit meta title and description"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit Meta Details</span>
                </button>
              </div>
            </div>

            {/* ── 4. BOX 4: Delete Post / Danger Zone (Wrapped box at the bottom) ── */}
            <div className="bg-white rounded-2xl border border-rose-200/90 shadow-xs p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-rose-700 tracking-tight flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                    <span>Delete Post</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                    Once you delete this post, there is no going back. All article content, images, and search engine references will be permanently removed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                  title="Delete post permanently"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Post</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* MODE 2: IN-PAGE READER PREVIEW (Clean Unwrapped Layout)        */
          /* ============================================================== */
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-2">
            <article className="space-y-8">
              {/* Title & Subtitle Header */}
              <header className="space-y-4">
                <h1 className="font-lora text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 leading-tight">
                  {blogDetails.title || post.title || 'Untitled Blog Post'}
                </h1>

                {(blogDetails.description || post.excerpt || post.subtitle || post.seoDescription) && (
                  <p className="font-medium-sans italic text-lg sm:text-xl text-zinc-600 font-light leading-relaxed my-3.5">
                    {blogDetails.description || post.excerpt || post.subtitle || post.seoDescription}
                  </p>
                )}

                {/* Author Meta Bar with EA Avatar Badge */}
                <div className="flex items-center justify-between pt-4 border-t border-b border-zinc-200 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#8F3EC9] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      EA
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-zinc-900">
                        {post.author || 'Energy Autonomy'}
                      </h5>
                      <p className="text-xs text-zinc-500">
                        {isPublished ? 'Published' : 'Draft'} • {extractMinutes(blogDetails.readTime || post.readTime || post.readingTime || '1')} min read
                      </p>
                    </div>
                  </div>

                  {(blogDetails.labelName || post.label_name || post.labelName || post.categoryName) && (
                    <span className="px-3 py-1 bg-purple-50 text-[#8F3EC9] border border-purple-100 text-xs rounded-full font-medium">
                      {blogDetails.labelName || post.label_name || post.labelName || post.categoryName}
                    </span>
                  )}
                </div>
              </header>

              {/* Cover Image in Reader View */}
              {Boolean(getBlogImage(blogDetails.image || post.featuredImage || post.image)) && (
                <div className="w-full max-h-80 sm:max-h-96 rounded-2xl overflow-hidden shadow-md border border-zinc-200/80 bg-zinc-100">
                  <img
                    src={getBlogImage(blogDetails.image || post.featuredImage || post.image)}
                    alt={post.title}
                    className="w-full h-full object-cover max-h-80 sm:max-h-96"
                  />
                </div>
              )}

              {/* Rendered Body Preview */}
              <div className="prose prose-lg max-w-none font-medium-serif text-lg sm:text-xl leading-relaxed text-zinc-800">
                {hasRichContent ? (
                  <MediumEditor initialContent={post.contentJson} editable={false} />
                ) : post.contentJson ? (
                  renderTiptapNode(post.contentJson, 0)
                ) : (
                  <div className="space-y-4 text-base sm:text-lg text-zinc-800 leading-relaxed whitespace-pre-wrap">
                    {(post.content || post.description || 'No article content available.').split('\n\n').filter(Boolean).map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Article Tags / Category Footer */}
              <div className="pt-8 border-t border-zinc-200 flex items-center gap-2 flex-wrap">
                {(blogDetails.labelName || post.label_name || post.labelName || post.categoryName) && (
                  <span className="px-3 py-1 bg-purple-50 text-[#8F3EC9] border border-purple-100 text-xs rounded-full font-medium">
                    #{blogDetails.labelName || post.label_name || post.labelName || post.categoryName}
                  </span>
                )}
                {post.tags &&
                  (Array.isArray(post.tags) ? post.tags : (post.tags || '').split(','))
                    .map((t) => (typeof t === 'string' ? t.trim() : t?.name || ''))
                    .filter(Boolean)
                    .map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-50 text-[#8F3EC9] border border-purple-100 text-xs rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
              </div>
            </article>

            {/* Bottom Footer Controls */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <Link
                to={`/blog/edit/${post.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Full Article</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. RIGHT-SIDE SLIDE-OVER SIDEBAR DRAWER (Smooth Slide-In From Right) ── */}
      {drawerMode && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-backdrop-fade"
            onClick={() => setDrawerMode(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 pointer-events-none">
            <div className="w-screen max-w-2xl sm:max-w-3xl bg-white shadow-2xl flex flex-col pointer-events-auto border-l border-slate-200 animate-drawer-slide-in">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {drawerMode === 'meta' ? 'Edit Meta Details' : 'Edit Blog Details'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {drawerMode === 'meta'
                      ? 'Update meta title and description for search engines & previews'
                      : 'Update title, description, cover image, read time, and label name'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerMode(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div ref={drawerBodyRef} className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
                {/* Error Banner */}
                {saveError && (
                  <div className="flex items-center justify-between gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg animate-fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSaveError('')}
                      className="text-rose-400 hover:text-rose-700 text-sm font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* ── META DETAILS DRAWER MODE: Only Meta Title & Meta Description ── */}
                {drawerMode === 'meta' && (
                  <div className="space-y-5">
                    {/* Meta Title */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Meta Title <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-[10px] ${metaDetails.seoTitle.length > 60 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                          {metaDetails.seoTitle.length}/60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={metaDetails.seoTitle}
                        onChange={(e) => {
                          setMetaDetails((prev) => ({ ...prev, seoTitle: e.target.value }));
                          if (saveError) setSaveError('');
                        }}
                        placeholder="Enter SEO meta title..."
                        className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-slate-900 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none transition-all"
                      />
                    </div>

                    {/* Meta Description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Meta Description <span className="text-red-500">*</span>
                        </label>
                        <span className={`text-[10px] ${metaDetails.seoDescription.length > 160 ? 'text-amber-500 font-semibold' : 'text-slate-400'}`}>
                          {metaDetails.seoDescription.length}/160 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={metaDetails.seoDescription}
                        onChange={(e) => {
                          setMetaDetails((prev) => ({ ...prev, seoDescription: e.target.value }));
                          if (saveError) setSaveError('');
                        }}
                        placeholder="Enter concise search engine meta description..."
                        className="w-full px-3.5 py-2.5 text-xs text-slate-700 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none resize-none leading-relaxed transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* ── BLOG DETAILS DRAWER MODE: Clean form fields ── */}
                {drawerMode === 'details' && (
                  <div className="space-y-5">
                    {/* 1. Cover Image */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Cover Image
                      </label>

                      {blogDetails.image ? (
                        <div className="relative w-64 sm:w-72 h-36 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100 shadow-2xs">
                          <img
                            src={getBlogImage(blogDetails.image)}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
                              title="Remove Cover Image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-64 sm:w-72 p-4 border-2 border-dashed border-slate-200 bg-slate-50/60 rounded-lg text-center hover:bg-purple-50/20 hover:border-purple-300 transition-all">
                          {uploadingImage ? (
                            <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-[#8F3EC9]">
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
                                Recommended: 16:9 image
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Title Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={blogDetails.title}
                        onChange={(e) => {
                          setBlogDetails((prev) => ({ ...prev, title: e.target.value }));
                          if (saveError) setSaveError('');
                        }}
                        placeholder="Article title..."
                        className="w-full px-3.5 py-2.5 bg-white text-sm font-bold text-slate-900 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none transition-all"
                      />
                    </div>

                    {/* 3. Subtitle / Summary Excerpt Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Subtitle / Summary Excerpt <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={blogDetails.description}
                        onChange={(e) => {
                          setBlogDetails((prev) => ({ ...prev, description: e.target.value }));
                          if (saveError) setSaveError('');
                        }}
                        placeholder="Write a brief subtitle or summary for readers..."
                        className="w-full px-3.5 py-2 text-xs text-slate-700 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none resize-none leading-relaxed transition-all"
                      />
                    </div>

                    {/* 4. Label Name & Estimated Read Time Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Label Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={blogDetails.labelName}
                          onChange={(e) => {
                            setBlogDetails((prev) => ({ ...prev, labelName: e.target.value }));
                            if (saveError) setSaveError('');
                          }}
                          placeholder="e.g. ENERGY & AWARENESS"
                          className="w-full px-3.5 py-2.5 bg-white text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Estimated Read Time <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={blogDetails.readTime}
                            onChange={(e) => {
                              const countOnly = e.target.value.replace(/\D/g, '');
                              setBlogDetails((prev) => ({ ...prev, readTime: countOnly }));
                              if (saveError) setSaveError('');
                            }}
                            placeholder="e.g. 5"
                            className="w-full pl-3.5 pr-20 py-2.5 bg-white text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 focus:border-[#8F3EC9] focus:ring-0 outline-none transition-all"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-slate-400 font-medium">
                            min read
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setDrawerMode(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={drawerMode === 'meta' ? handleSaveMetaDetails : handleSaveBlogDetails}
                  disabled={isSavingDetails}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] disabled:opacity-70 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  {isSavingDetails ? (
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
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
