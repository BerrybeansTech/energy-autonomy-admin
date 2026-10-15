import React from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { Trash2, Plus, Minus, Columns, Sparkles } from 'lucide-react'

export const DEFAULT_KEYPOINT_ITEMS = [
  {
    keypoint: 'Looks responsible outside',
    statement: 'carrying quiet resentment inside',
  },
  {
    keypoint: 'Looks calm outside',
    statement: 'afraid to disappoint others inside',
  },
  {
    keypoint: 'Looks strong outside',
    statement: 'feeling unsupported inside',
  },
]

export function KeypointStatementView({ node, updateAttributes, deleteNode, selected, editor }) {
  const isEditable = editor?.isEditable ?? true
  const items = Array.isArray(node.attrs.items) ? node.attrs.items : DEFAULT_KEYPOINT_ITEMS

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    updateAttributes({ items: updated, count: updated.length })
  }

  const handleAddRow = () => {
    if (items.length >= 8) return
    const updated = [
      ...items,
      {
        keypoint: `Keypoint ${items.length + 1}`,
        statement: `statement or reflection ${items.length + 1}`,
      },
    ]
    updateAttributes({ items: updated, count: updated.length })
  }

  const handleRemoveRow = (index) => {
    if (items.length <= 1) return
    const updated = items.filter((_, i) => i !== index)
    updateAttributes({ items: updated, count: updated.length })
  }

  return (
    <NodeViewWrapper className="relative my-7 group select-none transition-all">
      {/* Floating Toolbar on Hover when editing */}
      {isEditable && (
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider px-1 flex items-center gap-1">
            <Columns className="w-3 h-3 text-[#8F3EC9]" />
            <span>{items.length} Contrast Rows</span>
          </span>
          {items.length < 8 && (
            <button
              type="button"
              onClick={handleAddRow}
              className="p-1 text-slate-500 hover:text-[#8F3EC9] rounded hover:bg-purple-50 transition-colors cursor-pointer"
              title="Add Row (Max 8)"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Widget Rows Container */}
      <div
        className={`w-full space-y-2.5 transition-all ${
          selected ? 'ring-2 ring-[#8F3EC9] ring-offset-4 rounded-xl' : ''
        }`}
      >
        {items.map((row, idx) => (
          <div
            key={idx}
            className="relative group/row flex flex-col sm:flex-row items-stretch rounded-lg sm:rounded-xl overflow-hidden shadow-2xs transition-all border border-slate-100/60"
          >
            {/* Left Column: Keypoint (Warm Beige/Cream) */}
            <div
              className="w-full sm:w-[45%] flex items-center px-5 sm:px-6 py-3.5 sm:py-4 transition-colors"
              style={{ backgroundColor: '#F6F1EA' }}
            >
              {isEditable ? (
                <input
                  type="text"
                  value={row.keypoint || ''}
                  onChange={(e) => handleItemChange(idx, 'keypoint', e.target.value)}
                  placeholder="Keypoint..."
                  className="w-full bg-transparent border-b border-transparent hover:border-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white/60 rounded px-1.5 py-0.5 text-[#241D17] font-serif font-bold text-[15px] sm:text-[16px] leading-snug outline-none transition-all placeholder:text-stone-400"
                />
              ) : (
                <span className="text-[#241D17] font-serif font-bold text-[15px] sm:text-[16px] leading-snug block">
                  {row.keypoint}
                </span>
              )}
            </div>

            {/* Right Column: Statement (Soft Lavender) */}
            <div
              className="w-full sm:w-[55%] flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 transition-colors"
              style={{ backgroundColor: '#F0EEF9' }}
            >
              <div className="flex-1 min-w-0">
                {isEditable ? (
                  <input
                    type="text"
                    value={row.statement || ''}
                    onChange={(e) => handleItemChange(idx, 'statement', e.target.value)}
                    placeholder="Statement..."
                    className="w-full bg-transparent border-b border-transparent hover:border-[#8F3EC9]/30 focus:border-[#8F3EC9] focus:bg-white/60 rounded px-1.5 py-0.5 text-[#6B5B7B] font-serif font-normal text-[15px] sm:text-[16px] leading-snug outline-none transition-all placeholder:text-purple-300"
                  />
                ) : (
                  <span className="text-[#6B5B7B] font-serif font-normal text-[15px] sm:text-[16px] leading-snug block">
                    {row.statement}
                  </span>
                )}
              </div>

              {/* Delete row button (Editor mode only) */}
              {isEditable && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="opacity-0 group-hover/row:opacity-100 text-purple-300 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-md transition-all cursor-pointer shrink-0"
                  title="Remove row"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </NodeViewWrapper>
  )
}

// TipTap Custom Node Extension
export const KeypointStatement = Node.create({
  name: 'keypointStatement',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_KEYPOINT_ITEMS,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-items')
          if (raw) {
            try {
              return JSON.parse(raw)
            } catch (e) {
              // ignore
            }
          }
          return DEFAULT_KEYPOINT_ITEMS
        },
        renderHTML: (attributes) => ({
          'data-items': JSON.stringify(attributes.items || DEFAULT_KEYPOINT_ITEMS),
        }),
      },
      count: {
        default: 3,
        parseHTML: (element) => parseInt(element.getAttribute('data-count') || '3', 10),
        renderHTML: (attributes) => ({
          'data-count': (attributes.items?.length || 3).toString(),
        }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="keypoint-statement"]' },
      { tag: 'div.ea-keypoint-statement-container' },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const items = node.attrs.items || DEFAULT_KEYPOINT_ITEMS
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'keypoint-statement',
        class: 'ea-keypoint-statement-container',
        'data-items': JSON.stringify(items),
        'data-count': items.length.toString(),
      }),
      ...items.map((it) => [
        'div',
        {
          class: 'ea-keypoint-statement-row',
          style: 'display: flex; margin-bottom: 10px; border-radius: 12px; overflow: hidden;',
        },
        [
          'div',
          {
            class: 'ea-keypoint-col',
            style: 'width: 45%; background-color: #F6F1EA; padding: 16px 24px; font-weight: bold; color: #241D17; font-family: serif;',
          },
          it.keypoint || '',
        ],
        [
          'div',
          {
            class: 'ea-statement-col',
            style: 'width: 55%; background-color: #F0EEF9; padding: 16px 24px; color: #6B5B7B; font-family: serif;',
          },
          it.statement || '',
        ],
      ]),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(KeypointStatementView)
  },

  addCommands() {
    return {
      setKeypointStatement:
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

export default KeypointStatement
