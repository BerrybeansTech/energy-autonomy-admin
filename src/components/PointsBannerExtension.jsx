import React from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { Trash2, Edit3, Sparkles, Plus, Minus } from 'lucide-react'

// Component for TipTap NodeView inside the editor
export function PointsBannerView({ node, updateAttributes, deleteNode, selected, editor }) {
  const isEditable = editor?.isEditable ?? true
  const points = Array.isArray(node.attrs.points) ? node.attrs.points : []

  const handlePointChange = (index, val) => {
    const updated = [...points]
    updated[index] = val
    updateAttributes({ points: updated, count: updated.length })
  }

  const handleAddPoint = () => {
    if (points.length >= 4) return
    const updated = [...points, `Point ${points.length + 1}`]
    updateAttributes({ points: updated, count: updated.length })
  }

  const handleRemovePoint = (index) => {
    if (points.length <= 2) return
    const updated = points.filter((_, i) => i !== index)
    updateAttributes({ points: updated, count: updated.length })
  }

  return (
    <NodeViewWrapper className="relative my-7 group select-none transition-all">
      {/* Action bar on hover when editing */}
      {isEditable && (
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-purple-100 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <span className="text-[10px] font-bold text-[#8F3EC9] uppercase tracking-wider px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{points.length} Points Banner</span>
          </span>
          {points.length < 4 && (
            <button
              type="button"
              onClick={handleAddPoint}
              className="p-1 text-slate-500 hover:text-[#8F3EC9] rounded hover:bg-purple-50 transition-colors"
              title="Add Point (Max 4)"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
            title="Delete Banner"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Styled Banner Container - borderless, soft lavender background, subtle rounded corners, symmetric end padding */}
      <div
        className={`w-full rounded-xl sm:rounded-2xl px-6 sm:px-10 md:px-12 py-[28px] transition-all ${
          selected ? 'ring-2 ring-[#8F3EC9] ring-offset-2' : ''
        }`}
        style={{ backgroundColor: '#EDE8F5', paddingTop: '28px', paddingBottom: '28px' }}
      >
        <div
          className="grid items-center text-center w-full gap-3 sm:gap-6 md:gap-8"
          style={{ gridTemplateColumns: `repeat(${points.length || 1}, minmax(0, 1fr))` }}
        >
          {points.map((pt, idx) => (
            <div
              key={idx}
              className="min-w-0 text-center relative group/item flex items-center justify-center"
            >
              {isEditable ? (
                <div className="relative w-full flex items-center justify-center">
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => handlePointChange(idx, e.target.value)}
                    className="w-full text-center bg-transparent border-b border-transparent hover:border-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white/70 rounded px-1 py-0.5 text-[#2D2535] outline-none transition-all"
                    style={{
                      fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      fontWeight: 500,
                      fontStyle: 'normal',
                      fontSize: '17px',
                      lineHeight: '30.6px',
                      letterSpacing: '0px',
                    }}
                    placeholder={`Point ${idx + 1}`}
                  />
                  {points.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(idx)}
                      className="absolute -top-1.5 -right-1 text-slate-300 hover:text-rose-500 opacity-0 group-item/item:opacity-100 hover:scale-110 transition-all p-0.5 cursor-pointer"
                      title="Remove point"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ) : (
                <span
                  className="text-[#2D2535] block w-full text-center px-1"
                  style={{
                    fontFamily: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 500,
                    fontStyle: 'normal',
                    fontSize: '17px',
                    lineHeight: '30.6px',
                    letterSpacing: '0px',
                  }}
                >
                  {pt}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// TipTap Custom Node Extension
export const PointsBanner = Node.create({
  name: 'pointsBanner',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      points: {
        default: [
          'You can pause.',
          'You can choose.',
          'You can restore.',
          'You can respond differently.',
        ],
        parseHTML: (element) => {
          const raw = element.getAttribute('data-points')
          if (raw) {
            try {
              return JSON.parse(raw)
            } catch (e) {
              // ignore
            }
          }
          const items = Array.from(element.querySelectorAll('.ea-point-item'))
          if (items.length > 0) {
            return items.map((el) => el.textContent.trim()).filter(Boolean)
          }
          return [
            'You can pause.',
            'You can choose.',
            'You can restore.',
            'You can respond differently.',
          ]
        },
        renderHTML: (attributes) => ({
          'data-points': JSON.stringify(attributes.points || []),
        }),
      },
      count: {
        default: 4,
        parseHTML: (element) => parseInt(element.getAttribute('data-count') || '4', 10),
        renderHTML: (attributes) => ({
          'data-count': (attributes.points?.length || 4).toString(),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="points-banner"]',
      },
      {
        tag: 'div.ea-points-banner',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const points = node.attrs.points || []
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'points-banner',
        class: 'ea-points-banner',
        'data-points': JSON.stringify(points),
        'data-count': points.length.toString(),
      }),
      [
        'div',
        { class: 'ea-points-container' },
        ...points.map((pt) => ['span', { class: 'ea-point-item' }, pt]),
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PointsBannerView)
  },

  addCommands() {
    return {
      setPointsBanner:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          })
        },
    }
  },
})

export default PointsBanner
