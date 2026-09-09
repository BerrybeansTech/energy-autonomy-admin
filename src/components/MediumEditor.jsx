import React, { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'

import {
  Bold,
  Italic,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Quote,
  Plus,
  X,
  Image as ImageIcon,
  Video,
  Minus,
  List,
  ListOrdered,
  Palette,
  Check,
  Unlink
} from 'lucide-react'

// Preset Colors for Word Coloring
const COLOR_PRESETS = [
  { name: 'Default Dark', color: '#292929' },
  { name: 'Medium Green', color: '#1a8917' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Ocean Blue', color: '#2563eb' },
  { name: 'Sky Cyan', color: '#0284c7' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Crimson Red', color: '#ef4444' },
  { name: 'Sunset Amber', color: '#f59e0b' },
  { name: 'Deep Gray', color: '#6b7280' },
]

const MediumEditor = ({ onJsonUpdate, initialContent }) => {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#1a8917')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  // Stable Bubble Toolbar position state
  const [bubblePosition, setBubblePosition] = useState({ show: false, top: 0, left: 0 })

  // Floating plus button position state (appears on empty lines)
  const [plusPosition, setPlusPosition] = useState({ show: false, top: 0 })

  // Floating menu modal states
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  // Floating Plus Menu Expanded state
  const [plusOpen, setPlusOpen] = useState(false)

  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  const updatePositions = (currentEditor) => {
    if (!currentEditor || !containerRef.current) return

    const { selection } = currentEditor.state
    const { empty, from, to, $anchor } = selection

    // Update Bubble Menu position directly from ProseMirror coordinates
    if (!empty) {
      try {
        const startCoords = currentEditor.view.coordsAtPos(from)
        const endCoords = currentEditor.view.coordsAtPos(to)
        const containerRect = containerRef.current.getBoundingClientRect()

        const selectionLeft = Math.min(startCoords.left, endCoords.left)
        const selectionRight = Math.max(startCoords.right, endCoords.right)
        const selectionTop = Math.min(startCoords.top, endCoords.top)

        const left = Math.max(80, (selectionLeft + selectionRight) / 2 - containerRect.left)
        const top = selectionTop - containerRect.top - 54

        setBubblePosition({
          show: true,
          top: top,
          left: left,
        })
      } catch {
        // preserve position on transient updates
      }
    } else {
      setBubblePosition({ show: false, top: 0, left: 0 })
      setShowColorPicker(false)
    }

    // Update Plus Icon position (appears on EVERY empty line)
    const parentNode = $anchor.parent
    const isLineEmpty = (parentNode.type.name === 'paragraph' || parentNode.type.name === 'heading') && parentNode.textContent === ''

    if (isLineEmpty && currentEditor.isFocused) {
      try {
        const coords = currentEditor.view.coordsAtPos($anchor.pos)
        const containerRect = containerRef.current.getBoundingClientRect()
        const topOffset = coords.top - containerRect.top - 4

        setPlusPosition({
          show: true,
          top: Math.max(0, topOffset),
        })
      } catch {
        setPlusPosition({ show: true, top: 20 })
      }
    } else {
      setPlusPosition({ show: false, top: 0 })
      setPlusOpen(false)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your blog...',
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-700 underline font-medium cursor-pointer',
        },
      }),
    ],
    editorProps: {
      transformPastedHTML(html) {
        return html.replace(/style="[^"]*"/gi, (styleAttr) => {
          return styleAttr
            .replace(/font-size\s*:[^;]+;?/gi, '')
            .replace(/font-family\s*:[^;]+;?/gi, '')
            .replace(/line-height\s*:[^;]+;?/gi, '')
        })
      },
    },
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      if (onJsonUpdate) {
        onJsonUpdate(editor.getJSON())
      }
      updatePositions(editor)
    },
    onSelectionUpdate: ({ editor }) => {
      updatePositions(editor)
    },
    onFocus: ({ editor }) => {
      updatePositions(editor)
    },
  })

  // Hide bubble toolbar if editor loses selection
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) {
        return
      }
      if (editor && editor.state.selection.empty) {
        setBubblePosition({ show: false, top: 0, left: 0 })
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [editor])

  if (!editor) return null

  // Word Color Helper
  const applyColor = (hexColor) => {
    if (hexColor) {
      editor.chain().focus().setColor(hexColor).run()
    } else {
      editor.chain().focus().unsetColor().run()
    }
    setShowColorPicker(false)
  }

  // Link Helpers
  const handleSetLink = () => {
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setShowLinkModal(false)
    setLinkUrl('')
  }

  // Floating Plus Actions
  const handleAddImageFromUrl = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageModal(false)
      setPlusOpen(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const src = event.target?.result
        if (src) {
          editor.chain().focus().setImage({ src: String(src) }).run()
        }
      }
      reader.readAsDataURL(file)
      setShowImageModal(false)
      setPlusOpen(false)
    }
  }

  const handleAddVideo = () => {
    if (videoUrl) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run()
      setVideoUrl('')
      setShowVideoModal(false)
      setPlusOpen(false)
    }
  }

  const handleAddDivider = () => {
    editor.chain().focus().setHorizontalRule().run()
    setPlusOpen(false)
  }

  const handleAddBulletList = () => {
    editor.chain().focus().toggleBulletList().run()
    setPlusOpen(false)
  }

  const handleAddOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run()
    setPlusOpen(false)
  }

  const currentColor = editor.getAttributes('textStyle').color || '#292929'

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto tiptap-editor pl-12">
      {/* ------------------------------------------------------------- */}
      {/* SELECTION BUBBLE TOOLBAR                                      */}
      {/* ------------------------------------------------------------- */}
      {bubblePosition.show && (
        <div
          style={{
            top: `${bubblePosition.top}px`,
            left: `${bubblePosition.left}px`,
            transform: 'translateX(-50%)',
          }}
          className="absolute z-50 flex items-center bg-zinc-900 text-white rounded-xl shadow-2xl px-3 py-1.5 space-x-1 border border-zinc-800 transition-all duration-75"
        >
          {/* Bold */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ${
              editor.isActive('bold') ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ${
              editor.isActive('italic') ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href || '')
              setShowLinkModal(true)
            }}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ${
              editor.isActive('link') ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

          {/* Heading 1 (Large Title) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 font-serif font-bold text-sm transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 1 }) ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Large Heading (H1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          {/* Heading 2 (Subtitle) */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 text-sm transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 2 }) ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Small Heading (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ${
              editor.isActive('blockquote') ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300'
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-zinc-700 mx-1" />

          {/* SPECIFIC WORD COLORING PICKER */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Change Specific Word Color"
            >
              <div
                className="w-4 h-4 rounded-full border border-white/50 shadow-inner"
                style={{ backgroundColor: currentColor }}
              />
              <Palette className="w-3.5 h-3.5 text-zinc-300" />
            </button>

            {/* Word Color Popover Swatches */}
            {showColorPicker && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl z-50 w-56 animate-in fade-in duration-100"
              >
                <div className="text-xs font-semibold text-zinc-400 mb-2 px-1">Specific Word Color</div>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.color}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyColor(preset.color)}
                      className="w-7 h-7 rounded-full border border-zinc-700 hover:scale-110 transition-transform relative flex items-center justify-center cursor-pointer"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {currentColor.toLowerCase() === preset.color.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#1a8917"
                    className="w-20 bg-zinc-800 border border-zinc-700 text-xs text-white rounded px-2 py-1 focus:outline-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyColor(customColor)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* FLOATING ROUNDED PLUS (+) ICON WITH LIST & NUMBERING OPTIONS   */}
      {/* ------------------------------------------------------------- */}
      {plusPosition.show && (
        <div
          style={{ top: `${plusPosition.top}px` }}
          className="absolute left-0 z-30 flex items-center space-x-2 transition-all duration-150"
        >
          {/* Plus Toggle Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPlusOpen(!plusOpen)}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
              plusOpen
                ? 'border-zinc-800 bg-zinc-900 text-white rotate-45'
                : 'border-zinc-300 hover:border-zinc-600 text-zinc-600 hover:text-zinc-900 bg-white shadow-xs'
            }`}
            title="Insert element"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Expanded Options Menu: Image, Video, Divider, Bullet List, Numbered Count */}
          {plusOpen && (
            <div className="flex items-center space-x-2 bg-white border border-zinc-200 rounded-full px-2 py-1 shadow-md animate-in fade-in slide-in-from-left-2 duration-150">
              {/* Image Option */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowImageModal(true)}
                className="w-8 h-8 rounded-full border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Add Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Divider Option */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddDivider}
                className="w-8 h-8 rounded-full border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Add Divider Line"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Bullet Points Option */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddBulletList}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('bulletList')
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-emerald-600/30 text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Bullet Points (Lists)"
              >
                <List className="w-4 h-4" />
              </button>

              {/* Numbered Count Option */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddOrderedList}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('orderedList')
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-emerald-600/30 text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Numbered Count List (1. 2. 3.)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Content Area */}
      <div className="bg-transparent text-zinc-900 font-medium-serif text-xl leading-relaxed min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md border border-zinc-200 space-y-4">
            <h4 className="text-base font-semibold text-zinc-800">Insert / Edit Link</h4>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setShowLinkModal(false)
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-1"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Remove Link</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetLink}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Save Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL (Upload / URL) */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-semibold text-zinc-800 flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <span>Insert Image</span>
              </h4>
              <button onClick={() => setShowImageModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Upload Local File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink mx-3 text-xs text-zinc-400 font-medium">OR VIA URL</span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Direct Image Web Address</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddImageFromUrl}
                disabled={!imageUrl}
                className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
              >
                Insert Image URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-semibold text-zinc-800 flex items-center space-x-2">
                <Video className="w-5 h-5 text-emerald-600" />
                <span>Embed YouTube Video</span>
              </h4>
              <button onClick={() => setShowVideoModal(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">YouTube Video Link</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddVideo}
                disabled={!videoUrl}
                className="px-5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
              >
                Embed Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediumEditor
