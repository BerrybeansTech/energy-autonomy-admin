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
  Globe,
  Sparkles,
  LayoutGrid
} from 'lucide-react'
import PointsBanner from './PointsBannerExtension'
import StatementCards, { COLOR_THEMES as CARD_THEMES } from './StatementCardsExtension'



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
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [pointsCount, setPointsCount] = useState(4)
  const [pointsList, setPointsList] = useState([
    'You can pause.',
    'You can choose.',
    'You can restore.',
    'You can respond differently.',
  ])

  // Statement Cards Modal state
  const [showStatementCardsModal, setShowStatementCardsModal] = useState(false)
  const [statementCardCount, setStatementCardCount] = useState(2)
  const [statementCardsList, setStatementCardsList] = useState([
    {
      tag: 'TOLERANCE SAYS',
      text: '"I can bear this."',
      theme: 'beige',
    },
    {
      tag: 'RESILIENCE SAYS',
      text: '"I can respond to this without losing myself."',
      theme: 'lavender',
    },
    {
      tag: 'AUTONOMY SAYS',
      text: '"I can create the energy I need."',
      theme: 'mint',
    },
  ])



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
      PointsBanner,
      StatementCards,
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

  const handleInsertPointsBanner = () => {
    if (onEditorInteraction) {
      onEditorInteraction()
    }
    const currentList = pointsList.slice(0, pointsCount).map((p) => p.trim())
    const validPoints = currentList.filter(Boolean)
    const pointsToInsert = validPoints.length >= 2 ? validPoints : pointsList.slice(0, pointsCount)

    executeCommand((chain) => {
      chain.insertContent({
        type: 'pointsBanner',
        attrs: {
          points: pointsToInsert,
          count: pointsToInsert.length,
        },
      }).run()
    })
    setShowPointsModal(false)
  }

  const handlePointInputChange = (index, value) => {
    const updated = [...pointsList]
    updated[index] = value
    setPointsList(updated)
  }

  const handleInsertStatementCards = () => {
    if (onEditorInteraction) {
      onEditorInteraction()
    }
    const cardsToInsert = statementCardsList.slice(0, statementCardCount)
    executeCommand((chain) => {
      chain.insertContent({
        type: 'statementCards',
        attrs: {
          cards: cardsToInsert,
          count: cardsToInsert.length,
        },
      }).run()
    })
    setShowStatementCardsModal(false)
  }

  const handleStatementCardFieldChange = (index, field, value) => {
    const updated = [...statementCardsList]
    updated[index] = { ...updated[index], [field]: value }
    setStatementCardsList(updated)
  }


  return (
    <div ref={containerRef} className="relative w-full tiptap-editor">
      {editable && (
        <div className="sticky top-0 z-40 bg-white pt-3 pb-2 mb-2 border-b border-slate-200/90 w-full">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {/* 1. History: Undo & Redo */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={!editor.can().undo()}
                onClick={() => executeCommand((chain) => chain.undo().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.can().undo()
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-[21px] h-[21px]" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={!editor.can().redo()}
                onClick={() => executeCommand((chain) => chain.redo().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.can().redo()
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-300 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-[21px] h-[21px]" />
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
                  className={`h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
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
                  <div className="absolute top-full mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        executeCommand((chain) => chain.setParagraph().run())
                        setShowStyleDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-serif font-bold flex items-center justify-between cursor-pointer transition-colors ${
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-serif font-bold flex items-center justify-between cursor-pointer transition-colors ${
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-serif font-semibold flex items-center justify-between cursor-pointer transition-colors ${
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer font-semibold text-[17px] select-none ${
                  editor.isActive('bold')
                    ? 'bg-purple-50 text-[#8F3EC9]'
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer italic font-serif text-[17px] font-semibold select-none ${
                  editor.isActive('italic')
                    ? 'bg-purple-50 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Italic (Ctrl+I)"
              >
                I
              </button>

              {/* Inline Code (<>) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleCode().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer font-mono text-sm font-bold tracking-tight select-none ${
                  editor.isActive('code')
                    ? 'bg-purple-50 text-[#8F3EC9]'
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
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    showColorPicker || editor.getAttributes('textStyle').color
                      ? 'bg-purple-50 text-[#8F3EC9]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Text Color"
                >
                  <span className="font-serif font-normal text-[17px] leading-none">T</span>
                  <span
                    className="w-4 h-[1.5px] rounded-full mt-0.5 transition-colors"
                    style={{ backgroundColor: currentColor || '#292929' }}
                  />
                </button>

                {showColorPicker && (
                  <div className="absolute top-full mt-2 -left-12 sm:left-0 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    showHighlightPicker || editor.isActive('highlight')
                      ? 'bg-purple-50 text-[#8F3EC9]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Text Highlight"
                >
                  <span className="font-serif font-normal text-[17px] leading-none">A</span>
                  <span
                    className="w-4 h-[1.5px] rounded-full mt-0.5 transition-colors"
                    style={{ backgroundColor: currentHighlightColor }}
                  />
                </button>

                {showHighlightPicker && (
                  <div className="absolute top-full mt-2 -left-16 sm:left-0 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                            <Check className="w-3.5 h-3.5 text-slate-800" />
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('link')
                    ? 'bg-purple-50 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Insert / Edit Link"
              >
                <LinkIcon className="w-[21px] h-[21px]" />
              </button>

              {/* Image */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowImageModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Insert Image"
              >
                <ImageIcon className="w-[21px] h-[21px]" />
              </button>

              {/* Quote */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleBlockquote().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('blockquote')
                    ? 'bg-purple-50 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Blockquote"
              >
                <Quote className="w-[21px] h-[21px]" />
              </button>

              {/* Divider Line */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.setHorizontalRule().run())}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Insert Divider"
              >
                <Minus className="w-[21px] h-[21px]" />
              </button>

              {/* Key Points Banner Widget */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowPointsModal(true)
                  setShowStatementCardsModal(false)
                  setShowStyleDropdown(false)
                  setShowColorPicker(false)
                  setShowHighlightPicker(false)
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showPointsModal || editor.isActive('pointsBanner')
                    ? 'bg-purple-100 text-[#8F3EC9] ring-2 ring-[#8F3EC9]/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-purple-50 hover:text-[#8F3EC9]'
                }`}
                title="Insert Key Points Banner Widget (2 to 4 points)"
              >
                <Sparkles className="w-[20px] h-[20px]" />
              </button>

              {/* Statement / Comparison Cards Widget */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowStatementCardsModal(true)
                  setShowPointsModal(false)
                  setShowStyleDropdown(false)
                  setShowColorPicker(false)
                  setShowHighlightPicker(false)
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showStatementCardsModal || editor.isActive('statementCards')
                    ? 'bg-purple-100 text-[#8F3EC9] ring-2 ring-[#8F3EC9]/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-purple-50 hover:text-[#8F3EC9]'
                }`}
                title="Insert Statement / Comparison Cards (1 to 3 Cards)"
              >
                <LayoutGrid className="w-[19px] h-[19px]" />
              </button>



              <div className="w-[1px] h-6 bg-slate-200 mx-1.5 shrink-0" />

              {/* 5. Lists */}
              {/* Bullet List */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleBulletList().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('bulletList')
                    ? 'bg-purple-50 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Bullet List"
              >
                <List className="w-[21px] h-[21px]" />
              </button>

              {/* Numbered List */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => executeCommand((chain) => chain.toggleOrderedList().run())}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  editor.isActive('orderedList')
                    ? 'bg-purple-50 text-[#8F3EC9]'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-[21px] h-[21px]" />
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
      {/* MODALS: LINK, IMAGE, KEY POINTS BANNER                        */}
      {/* ------------------------------------------------------------- */}

      {/* KEY POINTS BANNER WIDGET MODAL */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EDE8F5] text-[#8F3EC9] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Key Points Banner
                  </h4>
                  <p className="text-[12px] text-slate-500 font-normal">
                    Select 2 to 4 points to display horizontally on a soft background
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPointsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Point Count Selector (2 to 4) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Number of Points:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map((count) => {
                  const isSelected = pointsCount === count
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setPointsCount(count)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8F3EC9] text-white border-[#8F3EC9] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>{count} Points</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Text Input Fields for Each Point */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Point Messages:
                </label>
                <span className="text-[11px] text-slate-400">
                  {pointsCount} points
                </span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {Array.from({ length: pointsCount }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs font-medium text-slate-400 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={pointsList[idx] || ''}
                      onChange={(e) => handlePointInputChange(idx, e.target.value)}
                      placeholder={`e.g. Point ${idx + 1}...`}
                      className="flex-1 border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Live Visual Preview - borderless with soft rounded radius */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Preview
              </div>
              <div
                className="w-full rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-center"
                style={{ backgroundColor: '#EDE8F5' }}
              >
                <div className="flex flex-nowrap items-center justify-evenly gap-2 text-center w-full">
                  {pointsList.slice(0, pointsCount).map((pt, idx) => (
                    <span
                      key={idx}
                      className="flex-1 min-w-0 text-[#2D2535] text-xs sm:text-[14px] leading-relaxed px-1 truncate"
                      style={{
                        fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        fontWeight: 500,
                        fontStyle: 'normal',
                      }}
                    >
                      {pt || `Point ${idx + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPointsModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertPointsBanner}
                className="px-4 py-1.5 text-xs font-semibold bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Insert Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* STATEMENT / COMPARISON CARDS MODAL */}
      {showStatementCardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#8F3EC9] flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Statement / Comparison Cards
                  </h4>
                  <p className="text-[12px] text-slate-500 font-normal">
                    Add 1 to 3 side-by-side cards with custom labels, quotes, and themes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatementCardsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Card Count Selector (1 to 3) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Number of Cards:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((count) => {
                  const isSelected = statementCardCount === count
                  return (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setStatementCardCount(count)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8F3EC9] text-white border-[#8F3EC9] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>{count} {count === 1 ? 'Card' : 'Cards'}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Card Content & Color Selection */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {Array.from({ length: statementCardCount }).map((_, idx) => {
                const card = statementCardsList[idx] || {
                  tag: `STATEMENT ${idx + 1}`,
                  text: '"Your statement here."',
                  theme: 'beige',
                }
                const activeTheme = CARD_THEMES[card.theme] || CARD_THEMES.beige

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Card {idx + 1}
                      </span>
                      {/* Color theme swatches */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium mr-1">
                          Theme:
                        </span>
                        {Object.values(CARD_THEMES).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleStatementCardFieldChange(idx, 'theme', t.id)}
                            className={`w-5 h-5 rounded-md transition-all cursor-pointer border ${
                              card.theme === t.id
                                ? 'ring-2 ring-[#8F3EC9] ring-offset-1 scale-110'
                                : 'hover:scale-105 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: t.bg, border: t.border }}
                            title={t.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Tag / Label:
                        </label>
                        <input
                          type="text"
                          value={card.tag || ''}
                          onChange={(e) =>
                            handleStatementCardFieldChange(idx, 'tag', e.target.value)
                          }
                          placeholder="e.g. TOLERANCE SAYS"
                          className="w-full border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Quote / Text:
                        </label>
                        <input
                          type="text"
                          value={card.text || ''}
                          onChange={(e) =>
                            handleStatementCardFieldChange(idx, 'text', e.target.value)
                          }
                          placeholder='e.g. "I can bear this."'
                          className="w-full border border-slate-200 focus:border-[#8F3EC9] focus:ring-1 focus:ring-[#8F3EC9] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStatementCardsModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertStatementCards}
                className="px-4 py-1.5 text-xs font-semibold bg-[#8F3EC9] hover:bg-[#7B2EB3] text-white rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Insert Cards</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

