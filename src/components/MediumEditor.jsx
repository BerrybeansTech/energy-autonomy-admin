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
import { uploadApi } from '../services/api'

import {
  Undo,
  Redo,
  ChevronDown,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Quote,
  Minus,
  List,
  ListOrdered,
  Check,
  X,
  Upload,
  Globe
} from 'lucide-react'

// Curated brand color presets for Text Color
const COLOR_PRESETS = [
  { name: 'Default Dark', color: '#292929' },
  { name: 'Primary Purple', color: '#8F3EC9' },
  { name: 'Warm Coral', color: '#FE9B40' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Ocean Blue', color: '#2563eb' },
  { name: 'Sky Cyan', color: '#0284c7' },
  { name: 'Crimson Red', color: '#ef4444' },
  { name: 'Sunset Amber', color: '#f59e0b' },
  { name: 'Deep Gray', color: '#64748b' },
  { name: 'Muted Slate', color: '#94a3b8' },
]

// Soft pastel presets for Highlighter
const HIGHLIGHT_PRESETS = [
  { name: 'Soft Yellow', color: '#fef08a' },
  { name: 'Soft Green', color: '#bbf7d0' },
  { name: 'Soft Blue', color: '#bfdbfe' },
  { name: 'Soft Purple', color: '#e9d5ff' },
  { name: 'Soft Coral', color: '#fed7aa' },
  { name: 'Soft Rose', color: '#fbcfe8' },
]

const MediumEditor = ({ onJsonUpdate, onLineWrap, onEditorInteraction, initialContent, editable = true }) => {
  // Popover menus state
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#8F3EC9')

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  // Editor selection update ticker to keep toolbar active states in sync
  const [, setSelectionTick] = useState(0)

  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const styleMenuRef = useRef(null)
  const colorMenuRef = useRef(null)
  const highlightMenuRef = useRef(null)

  // Height & Cursor tracking for visual line-wrapping detection
  const prevHeightRef = useRef(0)
  const prevCursorYRef = useRef(0)
  const lineWrapTimeoutRef = useRef(null)

  // Calculates true rendered height of all content blocks (paragraphs/headings),
  // bypassing any CSS min-height on the parent .ProseMirror container.
  const getActualContentHeight = (dom) => {
    if (!dom || !dom.children) return 0
    let total = 0
    for (let i = 0; i < dom.children.length; i++) {
      total += dom.children[i].offsetHeight || 0
    }
    return total
  }

  // Calculates cursor's Y-coordinate relative to the editor container
  const getCursorYInEditor = (ed, dom) => {
    try {
      if (!ed?.view || ed.isDestroyed || !dom) return null
      const { selection } = ed.state
      const coords = ed.view.coordsAtPos(selection.head)
      if (!coords) return null
      const domRect = dom.getBoundingClientRect()
      return coords.top - domRect.top
    } catch {
      return null
    }
  }

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target)) {
        setShowStyleDropdown(false)
      }
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target)) {
        setShowColorPicker(false)
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(e.target)) {
        setShowHighlightPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (lineWrapTimeoutRef.current) clearTimeout(lineWrapTimeoutRef.current)
    }
  }, [])

  const editor = useEditor({
    editable: Boolean(editable),
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
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
          class: 'text-[#8F3EC9] underline font-medium cursor-pointer',
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
      handleKeyDown(view, event) {
        if (event.key === 'Enter') {
          // Enter creates a new line block - notify onLineWrap shortly after schema updates
          if (lineWrapTimeoutRef.current) clearTimeout(lineWrapTimeoutRef.current)
          lineWrapTimeoutRef.current = setTimeout(() => {
            if (onLineWrap && editor) {
              onLineWrap(editor.getJSON())
            }
          }, 60)
        }
        return false
      },
    },
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      if (onJsonUpdate) {
        onJsonUpdate(json)
      }
      setSelectionTick((t) => t + 1)

      // Visual line wrap detection: only when user is actively focused in editor
      if (!editor?.isFocused) return

      const dom = editor?.view?.dom
      if (dom) {
        const currentContentHeight = getActualContentHeight(dom)
        const cursorY = getCursorYInEditor(editor, dom)

        // Initialize baselines on initial load / first stroke
        if (prevHeightRef.current === 0 && currentContentHeight > 0) {
          prevHeightRef.current = currentContentHeight
        }
        if (prevCursorYRef.current === 0 && cursorY !== null) {
          prevCursorYRef.current = cursorY
        }

        // 1. Check if rendered paragraph/block height expanded (e.g. text wrapped to line below)
        const heightIncreased = prevHeightRef.current > 0 && currentContentHeight > prevHeightRef.current + 5

        // 2. Check if cursor dropped down to a new visual line below (cursor jumped down by >= 15px)
        const cursorDropped = cursorY !== null && prevCursorYRef.current > 0 && (cursorY - prevCursorYRef.current) >= 15

        if (heightIncreased || cursorDropped) {
          if (onLineWrap) {
            onLineWrap(json)
          }
        }

        prevHeightRef.current = currentContentHeight
        if (cursorY !== null) {
          prevCursorYRef.current = cursorY
        }
      }
    },
    onSelectionUpdate: () => {
      setSelectionTick((t) => t + 1)
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1)
    },
    onFocus: () => {
      setSelectionTick((t) => t + 1)
      if (onEditorInteraction) {
        onEditorInteraction()
      }
    },
    onBlur: () => {
      setSelectionTick((t) => t + 1)
    },
  })

  // Sync initialContent when prefilled in Edit Mode and initialize height baseline
  useEffect(() => {
    if (editor && initialContent) {
      try {
        const currentJson = JSON.stringify(editor.getJSON())
        const nextJson = JSON.stringify(initialContent)
        if (currentJson !== nextJson && !editor.isFocused) {
          editor.commands.setContent(initialContent, false)
          setTimeout(() => {
            if (editor?.view?.dom) {
              prevHeightRef.current = getActualContentHeight(editor.view.dom)
              prevCursorYRef.current = getCursorYInEditor(editor, editor.view.dom) || 0
            }
          }, 100)
        }
      } catch (err) {
        // fallback
      }
    }
  }, [editor, initialContent])

  useEffect(() => {
    if (editor?.view?.dom) {
      prevHeightRef.current = getActualContentHeight(editor.view.dom)
      prevCursorYRef.current = getCursorYInEditor(editor, editor.view.dom) || 0
    }
  }, [editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(Boolean(editable))
    }
  }, [editor, editable])

  if (!editor) return null

  // Universal Command Runner: works whether text is selected or cursor is idle for typing
  const executeCommand = (commandFn) => {
    if (!editor) return
    if (onEditorInteraction) {
      onEditorInteraction()
    }
    if (!editor.isFocused) {
      editor.commands.focus()
    }
    const chain = editor.chain().focus()
    commandFn(chain)
    setSelectionTick((t) => t + 1)
  }

  // Active state helpers
  const currentColor = editor.getAttributes('textStyle').color || ''
  const currentHighlightColor =
    editor.getAttributes('highlight').color ||
    (editor.isActive('highlight') ? '#fef08a' : '#fef08a')

  const getCurrentStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
    return 'Style'
  }

  // Formatting actions
  const applyColor = (hexColor) => {
    executeCommand((chain) => {
      if (hexColor) {
        chain.setColor(hexColor).run()
      } else {
        chain.unsetColor().run()
      }
    })
    setShowColorPicker(false)
  }

  const applyHighlight = (hexColor) => {
    executeCommand((chain) => {
      if (hexColor) {
        chain.setHighlight({ color: hexColor }).run()
      } else {
        chain.unsetHighlight().run()
      }
    })
    setShowHighlightPicker(false)
  }

  const handleSetLink = () => {
    if (onEditorInteraction) {
      onEditorInteraction()
    }
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setShowLinkModal(false)
    setLinkUrl('')
  }

  const handleAddImageFromUrl = () => {
    if (imageUrl) {
      if (onEditorInteraction) {
        onEditorInteraction()
      }
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageModal(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (onEditorInteraction) {
        onEditorInteraction()
      }
      setUploadingImage(true)
      try {
        const res = await uploadApi.upload(file)
        const fileUrl = res.file?.url || res.file?.path
        if (fileUrl) {
          editor.chain().focus().setImage({ src: fileUrl }).run()
        }
      } catch (err) {
        console.error('Failed to upload image:', err)
        alert('Image upload failed: ' + (err.message || 'Server error'))
      } finally {
        setUploadingImage(false)
        setShowImageModal(false)
        if (e.target) e.target.value = ''
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full tiptap-editor">
      {/* ------------------------------------------------------------- */}
      {/* ROUNDED TOP TOOLBAR (Substack-Style, Admin Panel Native)      */}
      {/* ------------------------------------------------------------- */}
      {editable && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md py-2.5 mb-5 border-b border-slate-200 flex items-center gap-1 sm:gap-1.5 flex-wrap shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
              {/* 1. History: Undo & Redo */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={!editor.can().undo()}
                onClick={() => executeCommand((chain) => chain.undo().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.can().undo()
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-[18px] h-[18px]" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={!editor.can().redo()}
                onClick={() => executeCommand((chain) => chain.redo().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.can().redo()
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-[18px] h-[18px]" />
              </button>

              <div className="w-[1px] h-6 bg-slate-200 mx-1.5 shrink-0" />

              {/* 2. Style Dropdown */}
              <div className="relative" ref={styleMenuRef}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowStyleDropdown(!showStyleDropdown)
                    setShowColorPicker(false)
                    setShowHighlightPicker(false)
                  }}
                  className={`h-9 px-3 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showStyleDropdown ||
                    editor.isActive('heading') ||
                    editor.isActive('blockquote') ||
                    editor.isActive('codeBlock')
                      ? 'bg-purple-50 text-[#8F3EC9]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Text Style"
                >
                  <span>{getCurrentStyleLabel()}</span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </button>

                {showStyleDropdown && (
                  <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        executeCommand((chain) => chain.setParagraph().run())
                        setShowStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        editor.isActive('paragraph') &&
                        !editor.isActive('heading') &&
                        !editor.isActive('blockquote') &&
                        !editor.isActive('codeBlock')
                          ? 'bg-purple-50 text-[#8F3EC9] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>Normal text</span>
                      {editor.isActive('paragraph') &&
                        !editor.isActive('heading') &&
                        !editor.isActive('blockquote') &&
                        !editor.isActive('codeBlock') && (
                          <Check className="w-3.5 h-3.5 text-[#8F3EC9]" />
                        )}
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        executeCommand((chain) => chain.toggleHeading({ level: 1 }).run())
                        setShowStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-serif font-bold flex items-center justify-between cursor-pointer transition-colors ${
                        editor.isActive('heading', { level: 1 })
                          ? 'bg-purple-50 text-[#8F3EC9]'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>Heading 1</span>
                      {editor.isActive('heading', { level: 1 }) && (
                        <Check className="w-3.5 h-3.5 text-[#8F3EC9]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        executeCommand((chain) => chain.toggleHeading({ level: 2 }).run())
                        setShowStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-serif font-bold flex items-center justify-between cursor-pointer transition-colors ${
                        editor.isActive('heading', { level: 2 })
                          ? 'bg-purple-50 text-[#8F3EC9]'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>Heading 2</span>
                      {editor.isActive('heading', { level: 2 }) && (
                        <Check className="w-3.5 h-3.5 text-[#8F3EC9]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        executeCommand((chain) => chain.toggleHeading({ level: 3 }).run())
                        setShowStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-serif font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        editor.isActive('heading', { level: 3 })
                          ? 'bg-purple-50 text-[#8F3EC9]'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span>Heading 3</span>
                      {editor.isActive('heading', { level: 3 }) && (
                        <Check className="w-3.5 h-3.5 text-[#8F3EC9]" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="w-[1px] h-6 bg-slate-200 mx-1.5 shrink-0" />

              {/* 3. Inline Typography Formatting */}
              {/* Bold (B) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleBold().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer font-bold text-base select-none ${
                  editor.isActive('bold')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Bold (Ctrl+B)"
              >
                B
              </button>

              {/* Italic (I) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleItalic().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer italic font-serif text-base font-semibold select-none ${
                  editor.isActive('italic')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Italic (Ctrl+I)"
              >
                I
              </button>

              {/* Strikethrough (S) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleStrike().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer line-through text-base font-semibold select-none ${
                  editor.isActive('strike')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Strikethrough"
              >
                S
              </button>

              {/* Inline Code (<>) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleCode().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer font-mono text-[13px] font-bold select-none ${
                  editor.isActive('code')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Inline Code"
              >
                &lt;&gt;
              </button>

              {/* Text Color (T with color bar) */}
              <div className="relative" ref={colorMenuRef}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowColorPicker(!showColorPicker)
                    setShowStyleDropdown(false)
                    setShowHighlightPicker(false)
                  }}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    showColorPicker || editor.getAttributes('textStyle').color
                      ? 'bg-purple-100 text-[#8F3EC9]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Text Color"
                >
                  <span className="font-serif font-bold text-base leading-none">T</span>
                  <span
                    className="w-4.5 h-[3.5px] rounded-full mt-0.5 shadow-2xs transition-colors"
                    style={{ backgroundColor: currentColor || '#292929' }}
                  />
                </button>

                {showColorPicker && (
                  <div className="absolute top-full mt-2 -left-12 sm:left-0 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Text Color
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset.color}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyColor(preset.color)}
                          className="w-7 h-7 rounded-full border border-slate-200 hover:scale-110 transition-transform relative flex items-center justify-center cursor-pointer shadow-2xs"
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        >
                          {currentColor.toLowerCase() === preset.color.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        placeholder="#8F3EC9"
                        className="w-20 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-[#8F3EC9]"
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyColor(customColor)}
                        className="px-2.5 py-1 bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {currentColor && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyColor(null)}
                        className="w-full mt-2 pt-2 border-t border-slate-100 text-center text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Reset to Default Color
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Text Highlight (A with highlight bar) */}
              <div className="relative" ref={highlightMenuRef}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setShowHighlightPicker(!showHighlightPicker)
                    setShowStyleDropdown(false)
                    setShowColorPicker(false)
                  }}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    showHighlightPicker || editor.isActive('highlight')
                      ? 'bg-purple-100 text-[#8F3EC9]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Text Highlight"
                >
                  <span className="font-serif font-bold text-base leading-none">A</span>
                  <span
                    className="w-4.5 h-[3.5px] rounded-full mt-0.5 shadow-2xs transition-colors"
                    style={{ backgroundColor: currentHighlightColor }}
                  />
                </button>

                {showHighlightPicker && (
                  <div className="absolute top-full mt-2 -left-16 sm:left-0 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Highlight Color
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {HIGHLIGHT_PRESETS.map((preset) => (
                        <button
                          type="button"
                          key={preset.color}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyHighlight(preset.color)}
                          className="w-6 h-6 rounded-lg border border-slate-200 hover:scale-110 transition-transform relative flex items-center justify-center cursor-pointer shadow-2xs"
                          style={{ backgroundColor: preset.color }}
                          title={preset.name}
                        >
                          {editor.isActive('highlight', { color: preset.color }) && (
                            <Check className="w-3 h-3 text-slate-800" />
                          )}
                        </button>
                      ))}
                    </div>

                    {editor.isActive('highlight') && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyHighlight(null)}
                        className="w-full pt-2 border-t border-slate-100 text-center text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Remove Highlight
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="w-[1px] h-6 bg-slate-200 mx-1.5 shrink-0" />

              {/* 4. Media & Inserts */}
              {/* Link */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setLinkUrl(editor.getAttributes('link').href || '')
                  setShowLinkModal(true)
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('link')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Insert / Edit Link"
              >
                <LinkIcon className="w-[18px] h-[18px]" />
              </button>

              {/* Image */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowImageModal(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Insert Image"
              >
                <ImageIcon className="w-[18px] h-[18px]" />
              </button>

              {/* Quote */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleBlockquote().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('blockquote')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Blockquote"
              >
                <Quote className="w-[18px] h-[18px]" />
              </button>

              {/* Divider Line */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.setHorizontalRule().run())}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Insert Divider"
              >
                <Minus className="w-[18px] h-[18px]" />
              </button>

              <div className="w-[1px] h-6 bg-slate-200 mx-1.5 shrink-0" />

              {/* 5. Lists */}
              {/* Bullet List */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleBulletList().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('bulletList')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Bullet List"
              >
                <List className="w-[18px] h-[18px]" />
              </button>

              {/* Numbered List */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleOrderedList().run())}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('orderedList')
                    ? 'bg-purple-100 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        )}

      {/* Editor Content Area */}
      <div
        onClick={() => {
          if (onEditorInteraction) {
            onEditorInteraction()
          }
        }}
        className="bg-transparent text-zinc-900 font-medium-serif text-xl leading-relaxed min-h-[420px]"
      >
        <EditorContent editor={editor} />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODALS: LINK, IMAGE, VIDEO                                    */}
      {/* ------------------------------------------------------------- */}

      {/* LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#8F3EC9]" />
                <span>Insert or Edit Link</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9]"
              autoFocus
            />

            <div className="flex items-center justify-between pt-2">
              {editor.isActive('link') ? (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setShowLinkModal(false)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Remove Link</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetLink}
                  className="px-4 py-1.5 text-xs font-bold bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#8F3EC9]" />
                <span>Insert Image</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Upload to Server */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#8F3EC9]" />
                  <span>Upload Local File to Server</span>
                </label>
                {uploadingImage ? (
                  <div className="flex items-center gap-2 text-xs text-[#8F3EC9] font-medium py-3 justify-center">
                    <svg className="w-4 h-4 animate-spin text-[#8F3EC9]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Uploading image to server...</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-[#8F3EC9] hover:file:bg-purple-100 cursor-pointer"
                  />
                )}
              </div>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-semibold tracking-wider">OR VIA DIRECT URL</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Direct Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#8F3EC9]" />
                  <span>Direct Image Web Address</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddImageFromUrl}
                disabled={!imageUrl}
                className="px-4 py-2 text-xs font-bold bg-[#8F3EC9] hover:bg-[#7B2EB3] disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Insert Image URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediumEditor
