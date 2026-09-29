import React, { useState, useEffect } from 'react';
import { scriptsApi } from '../services/api';
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ScriptsManagementPage = () => {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [placementFilter, setPlacementFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    script_code: '',
    placement: 'head',
    target_pages: 'all',
    is_active: 1,
  });

  const fetchScripts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await scriptsApi.getAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setScripts(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch tracking scripts');
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      script_code: '',
      placement: 'head',
      target_pages: 'all',
      is_active: 1,
    });
    setIsNewModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      script_code: item.script_code || '',
      placement: item.placement || 'head',
      target_pages: item.target_pages || 'all',
      is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
    });
  };

  const handleToggleActive = async (id) => {
    setTogglingId(id);
    try {
      const res = await scriptsApi.toggle(id);
      if (res.success) {
        setScripts((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: s.is_active ? 0 : 1 } : s))
        );
      }
    } catch (err) {
      alert('Failed to toggle script status: ' + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the tracking script "${name}"?`)) {
      return;
    }

    try {
      const res = await scriptsApi.delete(id);
      if (res.success) {
        setSuccessMsg(`Script "${name}" deleted successfully.`);
        setTimeout(() => setSuccessMsg(null), 3500);
        setScripts((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      alert('Failed to delete script: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        // Update
        const res = await scriptsApi.update(editingItem.id, formData);
        if (res.success) {
          setSuccessMsg(`Script "${formData.name}" updated successfully!`);
          setEditingItem(null);
          fetchScripts();
        }
      } else {
        // Create
        const res = await scriptsApi.create(formData);
        if (res.success) {
          setSuccessMsg(`Script "${formData.name}" created and active!`);
          setIsNewModalOpen(false);
          fetchScripts();
        }
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert('Failed to save script: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const safeScripts = Array.isArray(scripts) ? scripts : [];
  const filteredScripts = safeScripts.filter((s) => {
    if (!s) return false;
    if (placementFilter === 'all') return true;
    return s.placement === placementFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tracking Scripts & Pixels</h1>
          <p className="text-sm text-slate-500 mt-1">
            Inject custom tracking codes (Google Tag Manager, GA4, Meta Pixel, Hotjar) into &lt;head&gt; or &lt;body&gt;.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Tracking Script
          </button>
        </div>
      </div>

      {/* Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        {['all', 'head', 'body_top', 'body_bottom'].map((tab) => (
          <button
            key={tab}
            onClick={() => setPlacementFilter(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              placementFilter === tab
                ? 'bg-[#8F3EC9] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'all' && 'All Scripts'}
            {tab === 'head' && 'In <head> Tag'}
            {tab === 'body_top' && 'After <body> (Top)'}
            {tab === 'body_bottom' && 'Before </body> (Bottom)'}
          </button>
        ))}
      </div>

      {/* Scripts Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8F3EC9]" />
          Loading tracking scripts...
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Code className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No tracking scripts configured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add Google Analytics 4, Meta Pixel, Google Tag Manager or custom CSS/JS snippets.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#8F3EC9] rounded-lg hover:bg-[#7d33b2] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Script
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredScripts.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                item.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      {item.name}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          item.placement === 'head'
                            ? 'bg-blue-100 text-blue-700'
                            : item.placement === 'body_top'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.placement === 'head' && '<head>'}
                        {item.placement === 'body_top' && '<body> (top)'}
                        {item.placement === 'body_bottom' && '</body> (bottom)'}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Target:{' '}
                      <span className="font-mono text-slate-700 font-semibold">
                        {item.target_pages === 'all' ? 'All Pages (Global)' : item.target_pages}
                      </span>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleActive(item.id)}
                    disabled={togglingId === item.id}
                    title={item.is_active ? 'Click to deactivate' : 'Click to activate'}
                    className={`cursor-pointer transition-colors p-1 rounded-lg ${
                      item.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {item.is_active ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                </div>

                {/* Code Preview */}
                <div className="relative rounded-lg overflow-hidden bg-slate-900 p-3 text-xs font-mono text-emerald-400 max-h-36 overflow-y-auto mb-4">
                  <pre className="whitespace-pre-wrap break-all">{item.script_code}</pre>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.is_active ? (
                    <span className="text-emerald-600 font-medium">● Active & Injected</span>
                  ) : (
                    <span className="text-slate-400 font-medium">○ Inactive</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Edit script"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Delete script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add or Edit Script */}
      {(isNewModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Code className="w-5 h-5 text-[#8F3EC9]" />
                {editingItem ? `Edit Script: ${editingItem.name}` : 'Add New Tracking Script'}
              </h3>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Script Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Script / Tag Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Google Analytics GA4 (G-XXXXXX)"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9]"
                  required
                />
              </div>

              {/* Placement & Target Page */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Placement
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9]"
                  >
                    <option value="head">Inside &lt;head&gt; (Standard Analytics, Meta)</option>
                    <option value="body_top">After opening &lt;body&gt; (GTM noscript)</option>
                    <option value="body_bottom">Before closing &lt;/body&gt; (Chat widgets, Beacons)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Pages
                  </label>
                  <select
                    value={formData.target_pages}
                    onChange={(e) => setFormData({ ...formData, target_pages: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9]"
                  >
                    <option value="all">All Pages (Global)</option>
                    <option value="/">Home Page ( / )</option>
                    <option value="/check-eligibility">Eligibility Page (/check-eligibility)</option>
                    <option value="/quiz">Quiz Page (/quiz)</option>
                    <option value="/program">Program Page (/program)</option>
                    <option value="/offerings">Offerings Page (/offerings)</option>
                  </select>
                </div>
              </div>

              {/* Script Code Snippet */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Script / HTML Snippet <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  value={formData.script_code}
                  onChange={(e) => setFormData({ ...formData, script_code: e.target.value })}
                  placeholder={`<script>\n  // Tracking code snippet here...\n</script>`}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]"
                  required
                />
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.is_active === 1}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-[#8F3EC9] focus:ring-[#8F3EC9]"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Enable and inject this tracking script immediately
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : editingItem ? 'Update Script' : 'Create Script'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptsManagementPage;
