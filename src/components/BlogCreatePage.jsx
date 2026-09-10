import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import MediumEditor from './MediumEditor'
import { useBlog } from '../context/BlogContext'
import { useAuth } from '../context/AuthContext'
import {
  Eye,
  Edit3,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Share2,
  Bookmark,
  LayoutDashboard,
  FileText,
  PenSquare,
  Type,
  ArrowLeft,
  ChevronUp
} from 'lucide-react'

const BlogCreatePage = ({ onBackToDashboard }) => {
  const { logout } = useAuth() || {}
  const { id } = useParams()
  const blogContext = useBlog()
  const addPost = blogContext?.addPost
  const updatePost = blogContext?.updatePost
  const getPost = blogContext?.getPost
  const navigate = useNavigate()
  const location = useLocation()

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [showSubtitleInput, setShowSubtitleInput] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [tags, setTags] = useState(['Energy Autonomy', 'Sustainability', 'Green Tech'])
  const [newTagInput, setNewTagInput] = useState('')
  const [isPublishSuccess, setIsPublishSuccess] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const titleTextareaRef = useRef(null)
  const subtitleTextareaRef = useRef(null)

  // Auto-resize title textarea to fit multiline content
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto'
      titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px'
    }
  }, [title])


  // Auto-resize subtitle textarea to fit multiline content
  useEffect(() => {
    if (subtitleTextareaRef.current) {
      subtitleTextareaRef.current.style.height = 'auto'
      subtitleTextareaRef.current.style.height = subtitleTextareaRef.current.scrollHeight + 'px'
    }
  }, [subtitle, showSubtitleInput])
  
  const [editorJson, setEditorJson] = useState({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  })

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Load existing post if editing
  useEffect(() => {
    if (id && getPost) {
      const existing = getPost(id)
      if (existing) {
        setTitle(existing.title || '')
        if (existing.excerpt) {
          setSubtitle(existing.excerpt)
          setShowSubtitleInput(true)
        }
        if (existing.image) {
          setCoverImage(existing.image)
        }
        if (existing.tags) {
          setTags(Array.isArray(existing.tags) ? existing.tags : existing.tags.split(',').map(s => s.trim()).filter(Boolean))
        }
        if (existing.content) {
          try {
            const parsed = typeof existing.content === 'string' ? JSON.parse(existing.content) : existing.content
            if (parsed && (parsed.type === 'doc' || parsed.content)) {
              setEditorJson(parsed)
            } else {
              setEditorJson({
                type: 'doc',
                content: String(existing.content).split('\n\n').filter(Boolean).map(text => ({
                  type: 'paragraph',
                  content: [{ type: 'text', text }]
                }))
              })
            }
          } catch (err) {
            setEditorJson({
              type: 'doc',
              content: String(existing.content).split('\n\n').filter(Boolean).map(text => ({
                type: 'paragraph',
                content: [{ type: 'text', text }]
              }))
            })
          }
        }
      }
    }
  }, [id, getPost])

  // Calculate word count & reading time
  const { wordCount, readingTime } = useMemo(() => {
    let text = title + ' ' + subtitle + ' '
    const extractText = (node) => {
      if (node.text) text += node.text + ' '
      if (node.content) node.content.forEach(extractText)
    }
    if (editorJson && editorJson.content) {
      editorJson.content.forEach(extractText)
    }
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.ceil(words / 200))
    return { wordCount: words, readingTime: minutes }
  }, [title, subtitle, editorJson])

  // Cover Image upload
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(String(event.target.result))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Publish / Update Handler
  const handlePublish = () => {
    const postPayload = {
      title: title || 'Untitled Story',
      excerpt: subtitle || 'No excerpt provided.',
      content: JSON.stringify(editorJson),
      category: tags[0] || 'General',
      status: 'published',
      author: 'Admin',
      readTime: `${readingTime} min read`,
      tags: tags,
      image: coverImage || 'blog1',
    }

    if (id && updatePost) {
      updatePost(id, postPayload)
    } else if (addPost) {
      addPost(postPayload)
    }
    setIsPublishSuccess(true)
    setTimeout(() => {
      setIsPublishSuccess(false)
      if (onBackToDashboard) {
        onBackToDashboard()
      } else {
        navigate('/blog')
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-white text-[#242424] flex font-medium-sans relative selection:bg-purple-100 selection:text-purple-900">
      {/* ------------------------------------------------------------- */}
      {/* PERSISTENT ICON-ONLY / EXPANDABLE SIDEBAR                     */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#F7F8FA] border-r border-slate-200/80 z-40 flex flex-col transition-all duration-300 ease-in-out select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)] overflow-x-hidden ${
          isSidebarExpanded ? 'w-[240px]' : 'w-[64px]'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center transition-all duration-300 pt-2 ${
          isSidebarExpanded ? 'px-4 justify-between' : 'justify-center px-0'
        }`}>
          {isSidebarExpanded ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0 w-8.5 h-8.5 rounded-lg bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] flex items-center justify-center shadow-xs">
                  <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[14.5px] font-medium text-slate-800 leading-tight block truncate whitespace-nowrap">
                  Energy Autonomy
                </span>
              </div>

              {/* Collapse Sidebar Button at Far Right End */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSidebarExpanded(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-auto"
                title="Collapse Sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            /* When Collapsed: No logo/app name, ONLY show the Open Sidebar Icon button */
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSidebarExpanded(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#8F3EC9] hover:bg-purple-50 transition-colors cursor-pointer"
              title="Open Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
          {/* Dashboard Item */}
          <div className="relative group flex justify-center">
            <Link
              to="/dashboard"
              className={`transition-all duration-200 ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 p-0'
              }`}
            >
              <span className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Dashboard
                </span>
              )}
            </Link>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Dashboard
              </div>
            )}
          </div>

          {/* Blog Management Item */}
          <div className="relative group flex justify-center">
            <Link
              to="/blog"
              className={`transition-all duration-200 ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 p-0'
              }`}
            >
              <span className="shrink-0 text-slate-400 group-hover:text-slate-700 transition-colors">
                <FileText className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Blog Management
                </span>
              )}
            </Link>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Blog Management
              </div>
            )}
          </div>

          {/* Write New Blog (Active - Stays on page) */}
          <div className="relative group flex justify-center">
            <div
              className={`transition-all duration-200 cursor-default ${
                isSidebarExpanded
                  ? 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium text-[#8F3EC9] bg-purple-50/80 border border-purple-200/80 shadow-[0_2px_8px_rgba(143,62,201,0.06)]'
                  : 'w-10 h-10 flex items-center justify-center rounded-lg text-[#8F3EC9] bg-purple-50/80 border border-purple-200/80 shadow-[0_2px_8px_rgba(143,62,201,0.06)] p-0'
              }`}
            >
              <span className="shrink-0 text-[#8F3EC9]">
                <PenSquare className="w-5 h-5" />
              </span>
              {isSidebarExpanded && (
                <span className="whitespace-nowrap overflow-hidden text-[13.5px]">
                  Write New Blog
                </span>
              )}
            </div>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Write New Blog
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-slate-100 relative ${isSidebarExpanded ? 'p-3' : 'p-2 flex justify-center'}`}>
          {/* Popup Menu Above */}
          {isProfileOpen && isSidebarExpanded && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-scale-in origin-bottom">
                {/* User Info Header */}
                <div className="px-3.5 py-2 flex items-center gap-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white flex items-center justify-center font-medium text-sm shrink-0 shadow-2xs">
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">Admin</p>
                    <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">admin@gmail.com</p>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false)
                      if (onBackToDashboard) onBackToDashboard()
                      else navigate('/blog')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Exit Editor</span>
                  </button>

                  {logout && (
                    <button
                      type="button"
                      onClick={() => {
                        logout()
                        navigate('/login')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Profile Trigger Row */}
          <button
            type="button"
            onClick={() => {
              if (!isSidebarExpanded) {
                setIsSidebarExpanded(true)
                setIsProfileOpen(true)
              } else {
                setIsProfileOpen(!isProfileOpen)
              }
            }}
            className={`rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer group ${
              isSidebarExpanded ? 'w-full flex items-center justify-between p-2' : 'w-10 h-10 flex items-center justify-center p-0'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8F3EC9] via-[#A06BC6] to-[#FE9B40] text-white text-xs font-medium flex items-center justify-center shrink-0 shadow-2xs">
                A
              </div>
              {isSidebarExpanded && (
                <span className="text-[13px] font-normal text-slate-800 truncate">
                  Admin
                </span>
              )}
            </div>
            {isSidebarExpanded && (
              <svg
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER (OFFSET BY SIDEBAR)                            */}
      {/* ------------------------------------------------------------- */}
      <div className={`flex-1 flex flex-col min-h-screen bg-white transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'pl-[240px]' : 'pl-[64px]'
      }`}>
        {/* Top Action Bar (Clean right-aligned controls, Back button removed) */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-4 flex items-center justify-end">
          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Preview Toggle */}
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isPreviewMode
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Mode</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              )}
            </button>

            {/* Publish / Save Primary Button */}
            <button
              onClick={handlePublish}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-[#8F3EC9] hover:bg-[#7B2EB3] active:bg-[#68249B] rounded-lg shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{id ? 'Save Changes' : 'Publish'}</span>
            </button>
          </div>
        </div>

        {/* Publish / Update Toast Alert */}
        {isPublishSuccess && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-zinc-800 flex items-center space-x-3 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold">{id ? 'Blog Article Updated!' : 'Blog Article Published!'}</p>
              <p className="text-[11px] text-zinc-400">{id ? 'Changes have been saved successfully' : 'Post saved and added to blog list'}</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CANVAS MAIN BODY (Increased Width to max-w-5xl)               */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 pb-24">
        {!isPreviewMode ? (
          /* ================= EDIT MODE ================= */
          <div className="space-y-4">
            {/* Top Toolbar Row: Clean Borderless Inline Add Cover & Add Subtitle */}
            <div className="flex items-center gap-5 pt-2">
              {!coverImage && !showCoverInput && (
                <button
                  type="button"
                  onClick={() => setShowCoverInput(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#8F3EC9] transition-colors cursor-pointer py-1 select-none group"
                >
                  <ImageIcon className="w-4 h-4 text-[#8F3EC9] group-hover:scale-110 transition-transform" />
                  <span>Add cover image</span>
                </button>
              )}

              {!showSubtitleInput && !subtitle && (
                <button
                  type="button"
                  onClick={() => setShowSubtitleInput(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-[#8F3EC9] transition-colors cursor-pointer py-1 select-none group"
                >
                  <Type className="w-4 h-4 text-[#8F3EC9] group-hover:scale-110 transition-transform" />
                  <span>Add subtitle</span>
                </button>
              )}
            </div>

            {/* Cover Image Header Section */}
            <div className="relative group">
              {coverImage ? (
                <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-zinc-200 group">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCoverImage('')}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors cursor-pointer"
                    title="Remove Cover Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                showCoverInput && (
                  <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                      <span>Upload or select cover image</span>
                      <button
                        onClick={() => setShowCoverInput(false)}
                        className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Title Input (Multiline Auto-expanding, aligned with content starting line) */}
            <div className="pt-2">
              <textarea
                ref={titleTextareaRef}
                rows={1}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full font-lora text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 placeholder:text-zinc-300 border-none outline-none focus:ring-0 p-0 m-0 bg-transparent resize-none overflow-hidden leading-tight block"
              />
            </div>

            {/* Subtitle Input (Multiline Auto-expanding, equal gap above and below) */}
            {(showSubtitleInput || subtitle) && (
              <div className="relative flex items-start group/sub animate-fade-in my-3.5">
                <textarea
                  ref={subtitleTextareaRef}
                  rows={1}
                  autoFocus={showSubtitleInput && !subtitle}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Write a subtitle..."
                  className="w-full font-medium-sans italic text-lg sm:text-xl font-light text-zinc-600 placeholder:text-zinc-300 border-none outline-none focus:ring-0 p-0 m-0 bg-transparent pr-8 resize-none overflow-hidden leading-relaxed block"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSubtitle('')
                    setShowSubtitleInput(false)
                  }}
                  className="absolute right-0 top-0 text-zinc-300 hover:text-zinc-600 p-1 rounded transition-colors cursor-pointer"
                  title="Remove Subtitle"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Default Divider Line under Subtitle / Header */}
            <div className="border-b border-zinc-200/80 my-5" />

            {/* Core Medium Tiptap Editor Component */}
            <div>
              <MediumEditor
                onJsonUpdate={(json) => setEditorJson(json)}
                initialContent={editorJson}
              />
            </div>
          </div>
        ) : (
          /* ================= READER PREVIEW MODE ================= */
          <article className="space-y-8 animate-in fade-in duration-300">
            {/* Title & Subtitle */}
            <header className="space-y-4">
              <h1 className="font-lora text-4xl md:text-5xl font-extrabold text-zinc-900 leading-tight">
                {title || 'Untitled Blog Post'}
              </h1>
              {subtitle && (
                <p className="font-medium-sans italic text-xl text-zinc-600 font-light leading-relaxed my-3.5">
                  {subtitle}
                </p>
              )}

              {/* Author Meta Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-b border-zinc-200 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                    EA
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-zinc-900">Energy Autonomy Team</h5>
                    <p className="text-xs text-zinc-500">
                      Published on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {readingTime} min read
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-zinc-400">
                  <button className="hover:text-zinc-700 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="hover:text-zinc-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Cover Image in Reader View */}
            {coverImage && (
              <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md">
                <img src={coverImage} alt="Article Cover" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Render Editor Output Preview */}
            <div className="prose prose-lg max-w-none font-medium-serif text-xl leading-relaxed text-zinc-800">
              <MediumEditor initialContent={editorJson} onJsonUpdate={null} />
            </div>

            {/* Article Tags Footer */}
            <div className="pt-8 border-t border-zinc-200 flex items-center space-x-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        )}
      </main>
      </div>
    </div>
  )
}

export default BlogCreatePage
