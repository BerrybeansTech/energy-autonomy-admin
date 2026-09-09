import React, { useState } from 'react'
import { X, Copy, Check, Download, Upload, Code2, AlertCircle } from 'lucide-react'

const JsonExportModal = ({ isOpen, onClose, jsonContent, onImportJson }) => {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('export') // 'export' | 'import'
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  if (!isOpen) return null

  const formattedJson = JSON.stringify(jsonContent, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medium-blog-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportSubmit = () => {
    try {
      setImportError('')
      const parsed = JSON.parse(importText)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON object format')
      }
      onImportJson(parsed)
      onClose()
    } catch (err) {
      setImportError(err.message || 'Invalid JSON input. Please check syntax.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Editor JSON Schema</h3>
              <p className="text-xs text-slate-400">Structured Tiptap JSON payload format</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tabs */}
            <div className="bg-slate-800 p-1 rounded-lg flex space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('export')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'export'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Export Format
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'import'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Import JSON
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-950 font-mono text-sm">
          {activeTab === 'export' ? (
            <div className="relative">
              <pre className="text-emerald-400 leading-relaxed overflow-x-auto p-4 bg-slate-900/60 rounded-lg border border-slate-800/80">
                <code>{formattedJson}</code>
              </pre>
            </div>
          ) : (
            <div className="space-y-4 font-sans">
              <p className="text-sm text-slate-300">
                Paste a previously exported Tiptap JSON schema structure below to load it into the editor:
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste JSON here... e.g. { "type": "doc", "content": [...] }'
                rows={12}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {importError && (
                <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {activeTab === 'export' ? `${formattedJson.length} characters` : 'JSON Importer'}
          </span>

          <div className="flex items-center space-x-3">
            {activeTab === 'export' ? (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleImportSubmit}
                className="flex items-center space-x-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Load into Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JsonExportModal
