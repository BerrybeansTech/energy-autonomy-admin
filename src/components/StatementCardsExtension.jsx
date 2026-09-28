import React, { useState } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { Trash2, Plus, Minus, Palette, LayoutGrid } from 'lucide-react'

export const COLOR_THEMES = {
  beige: {
    id: 'beige',
    name: 'Warm Beige',
    bg: '#F6F1EA',
    border: '1px solid rgba(138, 123, 110, 0.15)',
    tagColor: '#8A7B6E',
    textColor: '#241D17',
  },
  lavender: {
    id: 'lavender',
    name: 'Soft Lavender',
    bg: '#F4EEFB',
    border: '1px solid #D7C3F3',
    tagColor: '#8F3EC9',
    textColor: '#2D2535',
  },
  mint: {
    id: 'mint',
    name: 'Soft Mint',
    bg: '#EFF8F2',
    border: '1px solid #C4E9D0',
    tagColor: '#059669',
    textColor: '#1A3326',
  },
  blue: {
    id: 'blue',
    name: 'Soft Blue',
    bg: '#F0F6FE',
    border: '1px solid #C8DDF8',
    tagColor: '#2563EB',
    textColor: '#1E293B',
  },
  coral: {
    id: 'coral',
    name: 'Soft Coral',
    bg: '#FEF3F0',
    border: '1px solid #FCD4CA',
    tagColor: '#EA580C',
    textColor: '#3A201A',
  },
  neutral: {
    id: 'neutral',
    name: 'Minimal Slate',
    bg: '#F8FAFC',
    border: '1px solid #E2E8F0',
    tagColor: '#64748B',
    textColor: '#0F172A',
  },
}

export function StatementCardsView({ node, updateAttributes, deleteNode, selected, editor }) {
  const isEditable = editor?.isEditable ?? true
  const cards = Array.isArray(node.attrs.cards) ? node.attrs.cards : []
  const [activeColorMenuIdx, setActiveColorMenuIdx] = useState(null)

  const handleCardChange = (index, field, value) => {
    const updated = [...cards]
    updated[index] = { ...updated[index], [field]: value }
    updateAttributes({ cards: updated, count: updated.length })
  }

  const handleThemeChange = (index, themeId) => {
    handleCardChange(index, 'theme', themeId)
    setActiveColorMenuIdx(null)
  }

  const handleAddCard = () => {
    if (cards.length >= 3) return
    const newTheme = cards.length === 0 ? 'beige' : cards.length === 1 ? 'lavender' : 'mint'
    const updated = [
      ...cards,
      {
        tag: `STATEMENT ${cards.length + 1}`,
        text: '"Your statement or reflection here."',
        theme: newTheme,
      },
    ]
    updateAttributes({ cards: updated, count: updated.length })
  }

  const handleRemoveCard = (index) => {
    if (cards.length <= 1) return
    const updated = cards.filter((_, i) => i !== index)
    updateAttributes({ cards: updated, count: updated.length })
  }

  const gridColsClass =
    cards.length === 1
      ? 'grid-cols-1 max-w-md mx-auto'
      : cards.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-3'

  return (
    <NodeViewWrapper className="relative my-8 group select-none transition-all">
      {/* Floating Toolbar */}
      {isEditable && (
        <div className="absolute -top-3.5 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 opacity-0 group-hover:opacity-100 transition-all duration-150">
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider px-1 flex items-center gap-1">
            <LayoutGrid className="w-3 h-3 text-[#8F3EC9]" />
            <span>{cards.length} Cards</span>
          </span>
          {cards.length < 3 && (
            <button
              type="button"
              onClick={handleAddCard}
              className="p-1 text-slate-500 hover:text-[#8F3EC9] rounded hover:bg-purple-50 transition-colors cursor-pointer"
              title="Add Card (Max 3)"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Cards Grid"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cards Container - left aligned, not forced full width */}
      <div className="flex flex-wrap items-stretch justify-start gap-4 sm:gap-6 transition-all w-full my-6">
        {cards.map((card, idx) => {
          const theme = COLOR_THEMES[card.theme] || COLOR_THEMES.beige
          return (
            <div
              key={idx}
              className={`relative rounded-[16px] flex flex-col justify-start transition-all shadow-xs w-full max-w-[325px] min-h-[149.34px] box-border ${
                selected ? 'ring-2 ring-[#8F3EC9] ring-offset-2' : ''
              }`}
              style={{
                width: '100%',
                maxWidth: '325px',
                minHeight: '149.34px',
                borderRadius: '16px',
                paddingTop: '28px',
                paddingRight: '24px',
                paddingBottom: '28px',
                paddingLeft: '24px',
                borderWidth: '1px',
                borderStyle: 'solid',
                backgroundColor: theme.bg,
                borderColor: theme.border.replace(/^1px solid /, '') || '#D7C3F3',
                color: theme.textColor,
              }}
            >
              {/* Card toolbar for theme & removal */}
              {isEditable && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setActiveColorMenuIdx(activeColorMenuIdx === idx ? null : idx)}
                    className="p-1 text-slate-400 hover:text-slate-700 bg-white/80 rounded-md shadow-xs transition-colors cursor-pointer"
                    title="Change card color"
                  >
                    <Palette className="w-3.5 h-3.5" />
                  </button>

                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 bg-white/80 rounded-md shadow-xs transition-colors cursor-pointer"
                      title="Remove card"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}

                  {/* Theme popover picker */}
                  {activeColorMenuIdx === idx && (
                    <div className="absolute top-8 right-0 z-30 bg-white p-2 rounded-xl shadow-xl border border-slate-200 grid grid-cols-3 gap-1.5 w-32">
                      {Object.values(COLOR_THEMES).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeChange(idx, t.id)}
                          className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 cursor-pointer border ${
                            card.theme === t.id ? 'ring-2 ring-[#8F3EC9]' : ''
                          }`}
                          style={{ backgroundColor: t.bg, border: t.border }}
                          title={t.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tag / Title */}
              <div className="mb-2">
                {isEditable ? (
                  <input
                    type="text"
                    value={card.tag || ''}
                    onChange={(e) => handleCardChange(idx, 'tag', e.target.value)}
                    placeholder="TAG / TITLE"
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#8F3EC9] focus:bg-white/60 rounded px-1 outline-none transition-all"
                    style={{
                      fontFamily: "'Source Sans 3', sans-serif",
                      fontWeight: 700,
                      fontStyle: 'normal',
                      fontSize: '11px',
                      lineHeight: '20.35px',
                      letterSpacing: '1.1px',
                      textTransform: 'uppercase',
                      color: theme.tagColor,
                    }}
                  />
                ) : (
                  <span
                    className="block"
                    style={{
                      fontFamily: "'Source Sans 3', sans-serif",
                      fontWeight: 700,
                      fontStyle: 'normal',
                      fontSize: '11px',
                      lineHeight: '20.35px',
                      letterSpacing: '1.1px',
                      textTransform: 'uppercase',
                      color: theme.tagColor,
                    }}
                  >
                    {card.tag}
                  </span>
                )}
              </div>

              {/* Description / Quote */}
              <div className="mt-1">
                {isEditable ? (
                  <textarea
                    rows={2}
                    value={card.text || ''}
                    onChange={(e) => handleCardChange(idx, 'text', e.target.value)}
                    placeholder='"Your quote or reflection here."'
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#8F3EC9] focus:bg-white/60 rounded px-1 outline-none resize-none transition-all"
                    style={{
                      fontFamily: 'Lora, Georgia, serif',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '19px',
                      lineHeight: '28.5px',
                      letterSpacing: '0px',
                      color: theme.textColor,
                    }}
                  />
                ) : (
                  <p
                    className="m-0"
                    style={{
                      fontFamily: 'Lora, Georgia, serif',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      fontSize: '19px',
                      lineHeight: '28.5px',
                      letterSpacing: '0px',
                      color: theme.textColor,
                    }}
                  >
                    {card.text}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </NodeViewWrapper>
  )
}

export const StatementCards = Node.create({
  name: 'statementCards',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      cards: {
        default: [
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
        ],
        parseHTML: (element) => {
          const raw = element.getAttribute('data-cards')
          if (raw) {
            try {
              return JSON.parse(raw)
            } catch (e) {
              // ignore
            }
          }
          return [
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
          ]
        },
        renderHTML: (attributes) => ({
          'data-cards': JSON.stringify(attributes.cards || []),
        }),
      },
      count: {
        default: 2,
        parseHTML: (element) => parseInt(element.getAttribute('data-count') || '2', 10),
        renderHTML: (attributes) => ({
          'data-count': (attributes.cards?.length || 2).toString(),
        }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="statement-cards"]' },
      { tag: 'div.ea-statement-cards-grid' },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const cards = node.attrs.cards || []
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'statement-cards',
        class: 'ea-statement-cards-grid',
        'data-cards': JSON.stringify(cards),
        'data-count': cards.length.toString(),
      }),
      ...cards.map((c) => {
        const theme = COLOR_THEMES[c.theme] || COLOR_THEMES.beige
        return [
          'div',
          {
            class: `ea-statement-card ea-theme-${c.theme || 'beige'}`,
            style: `background-color: ${theme.bg}; border: ${theme.border}; color: ${theme.textColor};`,
          },
          [
            'span',
            {
              class: 'ea-statement-tag',
              style: `color: ${theme.tagColor};`,
            },
            c.tag || '',
          ],
          [
            'p',
            {
              class: 'ea-statement-text',
              style: `color: ${theme.textColor};`,
            },
            c.text || '',
          ],
        ]
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatementCardsView)
  },

  addCommands() {
    return {
      setStatementCards:
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

export default StatementCards
