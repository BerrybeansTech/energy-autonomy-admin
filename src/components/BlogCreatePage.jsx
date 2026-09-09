import React, { useState, useMemo } from 'react'
import MediumEditor from './MediumEditor'
import JsonExportModal from './JsonExportModal'
import { useBlog } from '../context/BlogContext'
import {
  ArrowLeft,
  Eye,
  Edit3,
  Code2,
  Send,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  BookOpen,
  Tag,
  X,
  Share2,
  Bookmark,
  Heart
} from 'lucide-react'

const BlogCreatePage = ({ onBackToDashboard }) => {
  const blogContext = useBlog()
  const addPost = blogContext?.addPost

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [tags, setTags] = useState(['Energy Autonomy', 'Sustainability', 'Green Tech'])
  const [newTagInput, setNewTagInput] = useState('')
  const [isPublishSuccess, setIsPublishSuccess] = useState(false)
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  
  const [editorJson, setEditorJson] = useState({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  })

  const [isPreviewMode, setIsPreviewMode] = useState(false)

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

  // Tag Handling
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()])
      }
      setNewTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

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

  // Publish Handler
  const handlePublish = () => {
    if (addPost) {
      addPost({
        title: title || 'Untitled Story',
        excerpt: subtitle || 'No excerpt provided.',
        content: JSON.stringify(editorJson),
        category: tags[0] || 'General',
        status: 'published',
        author: 'Admin',
        readTime: `${readingTime} min read`,
        tags: tags,
        image: coverImage || 'blog1',
      })
    }
    setIsPublishSuccess(true)
    setTimeout(() => {
      setIsPublishSuccess(false)
      if (onBackToDashboard) onBackToDashboard()
    }, 1500)
  }

  const handleImportJson = (newJson) => {
    setEditorJson(newJson)
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#242424] flex flex-col font-medium-sans">
      {/* ------------------------------------------------------------- */}
      {/* TOP ADMIN HEADER / ACTION BAR                                */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center space-x-1.5 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-zinc-200" />

          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500 font-medium">Draft Saved</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* JSON Export Button */}
          <button
            onClick={() => setIsJsonModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 rounded-full transition-colors border border-zinc-200"
            title="Inspect / Export Editor JSON"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>JSON Format</span>
          </button>

          {/* Preview Toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors ${
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

          {/* Publish Primary Button */}
          <button
            onClick={handlePublish}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1a8917] hover:bg-[#156e13] rounded-full shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Publish Toast Alert */}
      {isPublishSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-zinc-800 flex items-center space-x-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-semibold">Blog Article Published!</p>
            <p className="text-[11px] text-zinc-400">JSON schema exported & ready for live website</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CANVAS MAIN BODY                                             */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        {!isPreviewMode ? (
          /* ================= EDIT MODE ================= */
          <div className="space-y-6">
            {/* Cover Image Header Section */}
            <div className="relative group">
              {coverImage ? (
                <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-zinc-200 group">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCoverImage('')}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full transition-colors"
                    title="Remove Cover Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  {!showCoverInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCoverInput(true)}
                      className="flex items-center space-x-2 text-xs font-medium text-zinc-500 hover:text-emerald-700 transition-colors py-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Add Cover Image</span>
                    </button>
                  ) : (
                    <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-300 space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                        <span>Upload or Paste Cover Image URL</span>
                        <button
                          onClick={() => setShowCoverInput(false)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full font-medium-serif text-4xl md:text-5xl font-extrabold text-zinc-900 placeholder:text-zinc-300 border-none outline-none focus:ring-0 py-2 bg-transparent"
              />
            </div>

            {/* Subtitle Input */}
            <div>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Write a clear subtitle..."
                className="w-full font-medium-sans text-xl font-light text-zinc-600 placeholder:text-zinc-300 border-none outline-none focus:ring-0 pb-2 bg-transparent"
              />
            </div>

            {/* Divider Line under Subtitle / Description */}
            <div className="border-b border-zinc-200/80 my-4" />



            {/* Core Medium Tiptap Editor Component */}
            <MediumEditor
              onJsonUpdate={(json) => setEditorJson(json)}
              initialContent={editorJson}
            />
          </div>
        ) : (
          /* ================= READER PREVIEW MODE ================= */
          <article className="space-y-8 animate-in fade-in duration-300">
            {/* Title & Subtitle */}
            <header className="space-y-4">
              <h1 className="font-medium-serif text-4xl md:text-5xl font-extrabold text-zinc-900 leading-tight">
                {title || 'Untitled Blog Post'}
              </h1>
              {subtitle && (
                <p className="font-medium-sans text-xl text-zinc-600 font-light leading-relaxed">
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

      {/* ------------------------------------------------------------- */}
      {/* JSON EXPORT MODAL                                             */}
      {/* ------------------------------------------------------------- */}
      <JsonExportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        jsonContent={editorJson}
        onImportJson={handleImportJson}
      />
    </div>
  )
}

export default BlogCreatePage
