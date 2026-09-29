import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { seoApi, scriptsApi } from '../services/api';
import { 
  Globe, 
  Search, 
  Edit3, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X, 
  RefreshCw, 
  Plus, 
  Trash2,
  ChevronDown,
  Save
} from 'lucide-react';

const PREDEFINED_ROUTES = [
  {
    label: 'Home Page ( / )',
    route_path: '/',
    page_key: 'home',
    page_name: 'Home Page',
    default_title: 'Energy Autonomy — Reclaim Your Life Force & Vitality',
    default_description: 'Transform chronic exhaustion into unshakeable vital energy. Explore the Energy Autonomy framework designed for visionary leaders and high achievers.',
    default_keywords: 'Energy Autonomy, leadership energy, vitality framework, Pavani, holistic energy coaching',
  },
  {
    label: 'About Us / Pavani ( /about )',
    route_path: '/about',
    page_key: 'about',
    page_name: 'About Us / Pavani',
    default_title: 'About Energy Autonomy — Pavani & Our Mission',
    default_description: 'Learn about Pavani’s journey and the philosophy behind Energy Autonomy — helping leaders align conscious action with deep cellular vitality.',
    default_keywords: 'About Pavani, Energy Autonomy story, mission, holistic leadership coaching',
  },
  {
    label: 'Program & Framework ( /program )',
    route_path: '/program',
    page_key: 'program',
    page_name: 'Program & Framework',
    default_title: 'The Energy Autonomy Program — Transformational Journey',
    default_description: 'Explore the 3-pillar Energy Autonomy framework: Awareness, Restoration, and Sovereign Expression.',
    default_keywords: 'Energy Autonomy program, energy framework, vitality curriculum, leadership coaching program',
  },
  {
    label: 'Offerings & Mentorship ( /offerings )',
    route_path: '/offerings',
    page_key: 'offerings',
    page_name: 'Offerings & Mentorship',
    default_title: 'Offerings & Immersion Programs — Energy Autonomy',
    default_description: 'Explore our 1-on-1 bespoke executive coaching, immersive group retreats, and corporate energy mastery programs.',
    default_keywords: 'Energy coaching offerings, retreats, executive energy consulting, 1-on-1 mentorship',
  },
  {
    label: 'Check Eligibility ( /check-eligibility )',
    route_path: '/check-eligibility',
    page_key: 'eligibility',
    page_name: 'Eligibility Assessment',
    default_title: 'Check Your Eligibility — Energy Autonomy Mentorship',
    default_description: 'Complete our quick eligibility assessment to discover if the Energy Autonomy private advisory is the right fit.',
    default_keywords: 'Energy Autonomy eligibility, private consultation, application, leadership assessment',
  },
  {
    label: 'Eligibility Early Step ( /eligibility/early-step )',
    route_path: '/eligibility/early-step',
    page_key: 'eligibility_early_step',
    page_name: 'Eligibility Step Form',
    default_title: 'Step Assessment — Energy Autonomy',
    default_description: 'Tell us more about your current leadership context and energetic demands.',
    default_keywords: 'Energy Autonomy assessment step, application form',
  },
  {
    label: 'Energy Identity Quiz ( /quiz )',
    route_path: '/quiz',
    page_key: 'quiz',
    page_name: 'Energy Identity Quiz',
    default_title: 'Discover Your Energy Genie Type — Interactive Quiz',
    default_description: 'Take the 2-minute Energy Genie Quiz to discover your dominant energetic pattern and uncover where your vitality leaks.',
    default_keywords: 'Energy quiz, energy genie, personality test, burnout test, vitality archetype',
  },
  {
    label: 'Blog & Articles ( /blog )',
    route_path: '/blog',
    page_key: 'blog',
    page_name: 'Blog & Articles',
    default_title: 'Insights & Energy Wisdom Articles — Energy Autonomy',
    default_description: 'Read the latest essays, scientific insights, and philosophical deep dives on conscious leadership and energy autonomy.',
    default_keywords: 'Energy autonomy blog, vitality articles, leadership wisdom, burnout recovery tips',
  },
  {
    label: 'Global Site Fallback Default ( * )',
    route_path: '*',
    page_key: 'global_default',
    page_name: 'Global Site Default',
    default_title: 'Energy Autonomy — Reclaim Your Life Force',
    default_description: 'Energy Autonomy helps capable leaders and founders identify subconscious energy leaks and reclaim vital life force.',
    default_keywords: 'Energy Autonomy, vitality, leadership, life force',
  },
];

export const SeoManagementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab') === 'scripts' ? 'scripts' : 'seo';
  const [mainTab, setMainTab] = useState(currentTabParam);

  // Synchronize mainTab with URL search params
  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSearchParams(tab === 'scripts' ? { tab: 'scripts' } : {});
  };

  /* ─────────────────────────────────────────────────────────────
     SEO STATE & LOGIC
     ───────────────────────────────────────────────────────────── */
  const [seoList, setSeoList] = useState([]);
  const [seoLoading, setSeoLoading] = useState(true);
  const [seoError, setSeoError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedRouteChoice, setSelectedRouteChoice] = useState('/');
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [modalTab, setModalTab] = useState('general'); // 'general', 'social'
  const [showSocialPreview, setShowSocialPreview] = useState(false);
  const [seoSaving, setSeoSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [customError, setCustomError] = useState(null);

  const [formData, setFormData] = useState({
    page_name: '',
    page_key: '',
    route_path: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    og_type: 'website',
    twitter_card: 'summary_large_image',
    robots: 'index, follow',
    is_active: 1,
  });

  const fetchSeoList = async () => {
    setSeoLoading(true);
    setSeoError(null);
    try {
      const res = await seoApi.getAll();
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setSeoList(list);
    } catch (err) {
      setSeoError(err.message || 'Failed to fetch SEO settings');
      setSeoList([]);
    } finally {
      setSeoLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     TRACKING SCRIPTS STATE & LOGIC (GLOBAL INLINE)
     ───────────────────────────────────────────────────────────── */
  const [globalScripts, setGlobalScripts] = useState({
    head_script: '',
    body_top_script: '',
    body_bottom_script: '',
  });
  const [scriptsLoading, setScriptsLoading] = useState(true);
  const [scriptsSaving, setScriptsSaving] = useState(false);

  const fetchGlobalScripts = async () => {
    setScriptsLoading(true);
    try {
      const res = await scriptsApi.getGlobal();
      if (res && res.data) {
        setGlobalScripts({
          head_script: res.data.head_script || '',
          body_top_script: res.data.body_top_script || '',
          body_bottom_script: res.data.body_bottom_script || '',
        });
      }
    } catch (err) {
      console.error('Failed to load global scripts:', err);
    } finally {
      setScriptsLoading(false);
    }
  };

  const handleSaveGlobalScripts = async (e) => {
    if (e) e.preventDefault();
    setScriptsSaving(true);
    try {
      const res = await scriptsApi.saveGlobal(globalScripts);
      if (res.success) {
        setSuccessMsg('Global tracking scripts saved & updated successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
        if (res.data) {
          setGlobalScripts({
            head_script: res.data.head_script || '',
            body_top_script: res.data.body_top_script || '',
            body_bottom_script: res.data.body_bottom_script || '',
          });
        }
        await fetchGlobalScripts();
      }
    } catch (err) {
      setCustomError({
        title: 'Save Failed',
        message: err.message || 'Failed to save tracking scripts.',
      });
    } finally {
      setScriptsSaving(false);
    }
  };

  useEffect(() => {
    fetchSeoList();
    fetchGlobalScripts();
  }, []);

  const handleRouteChoiceChange = (choice) => {
    setSelectedRouteChoice(choice);
    const target = PREDEFINED_ROUTES.find((r) => r.route_path === choice);
    if (!target) return;

    const existing = seoList.find((s) => s.route_path === target.route_path || s.page_key === target.page_key);

    if (existing) {
      setEditingItem(existing);
      setIsCreatingNew(false);
      setFormData({
        page_name: existing.page_name || target.page_name,
        page_key: existing.page_key || target.page_key,
        route_path: existing.route_path || target.route_path,
        meta_title: existing.meta_title || target.default_title || '',
        meta_description: existing.meta_description || target.default_description || '',
        meta_keywords: existing.meta_keywords || target.default_keywords || '',
        canonical_url: `https://energyautonomy.com${target.route_path === '/' ? '' : target.route_path}`,
        og_title: existing.og_title || existing.meta_title || target.default_title || '',
        og_description: existing.og_description || existing.meta_description || target.default_description || '',
        og_image: existing.og_image || '',
        og_type: existing.og_type || 'website',
        twitter_card: existing.twitter_card || 'summary_large_image',
        robots: 'index, follow',
        is_active: existing.is_active !== undefined ? (existing.is_active ? 1 : 0) : 1,
      });
    } else {
      setEditingItem(null);
      setIsCreatingNew(true);
      setFormData({
        page_name: target.page_name,
        page_key: target.page_key,
        route_path: target.route_path,
        meta_title: target.default_title || '',
        meta_description: target.default_description || '',
        meta_keywords: target.default_keywords || '',
        canonical_url: `https://energyautonomy.com${target.route_path === '/' ? '' : target.route_path}`,
        og_title: target.default_title || '',
        og_description: target.default_description || '',
        og_image: '',
        og_type: 'website',
        twitter_card: 'summary_large_image',
        robots: 'index, follow',
        is_active: 1,
      });
    }
  };

  const handleOpenCreate = () => {
    setModalTab('general');
    handleRouteChoiceChange('/');
  };

  const handleEditClick = (item) => {
    setIsCreatingNew(false);
    setEditingItem(item);
    setModalTab('general');

    const matchedChoice = PREDEFINED_ROUTES.find((r) => r.route_path === item.route_path)?.route_path || PREDEFINED_ROUTES[0].route_path;
    setSelectedRouteChoice(matchedChoice);

    setFormData({
      page_name: item.page_name || '',
      page_key: item.page_key || '',
      route_path: item.route_path || '',
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
      meta_keywords: item.meta_keywords || '',
      canonical_url: `https://energyautonomy.com${item.route_path === '/' ? '' : item.route_path}`,
      og_title: item.og_title || item.meta_title || '',
      og_description: item.og_description || item.meta_description || '',
      og_image: item.og_image || '',
      og_type: item.og_type || 'website',
      twitter_card: item.twitter_card || 'summary_large_image',
      robots: item.robots || 'index, follow',
      is_active: item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
    });
  };

  const handleSeoSubmit = async (e) => {
    e.preventDefault();
    setSeoSaving(true);
    setSeoError(null);
    try {
      const autoCanonical = `https://energyautonomy.com${formData.route_path === '/' ? '' : formData.route_path}`;

      const payload = {
        ...formData,
        canonical_url: autoCanonical,
        robots: 'index, follow',
        structured_data: null,
      };

      const existing = editingItem || seoList.find((s) => s.route_path === formData.route_path || s.page_key === formData.page_key);

      if (existing && existing.id) {
        const res = await seoApi.update(existing.id, payload);
        if (res.success) {
          setSuccessMsg(`SEO for "${formData.page_name}" updated successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
          setEditingItem(null);
          setIsCreatingNew(false);
          fetchSeoList();
        }
      } else {
        const res = await seoApi.create(payload);
        if (res.success) {
          setSuccessMsg(`SEO for "${formData.page_name}" saved successfully!`);
          setTimeout(() => setSuccessMsg(null), 4000);
          setIsCreatingNew(false);
          setEditingItem(null);
          fetchSeoList();
        }
      }
    } catch (err) {
      setCustomError({
        title: 'Save Failed',
        message: err.message || 'An error occurred while saving page SEO settings.',
      });
    } finally {
      setSeoSaving(false);
    }
  };

  const handleDeleteClick = (item) => {
    if (item.page_key === 'global_default') {
      setCustomError({
        title: 'Action Prohibited',
        message: 'The Global Default SEO configuration cannot be deleted as it is the system fallback for all pages.',
      });
      return;
    }
    setDeleteModalItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalItem) return;
    setDeleting(true);
    try {
      const res = await seoApi.delete(deleteModalItem.id);
      if (res.success) {
        setSuccessMsg(`SEO configuration for "${deleteModalItem.page_name}" was deleted successfully!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setDeleteModalItem(null);
        fetchSeoList();
      }
    } catch (err) {
      setCustomError({
        title: 'Delete Failed',
        message: err.message || 'An error occurred while deleting the SEO configuration.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const safeList = Array.isArray(seoList) ? seoList : [];
  const filteredList = safeList.filter((item) => {
    if (!item) return false;
    const term = (searchFilter || '').toLowerCase();
    return (
      (item.page_name && item.page_name.toLowerCase().includes(term)) ||
      (item.route_path && item.route_path.toLowerCase().includes(term)) ||
      (item.meta_title && item.meta_title.toLowerCase().includes(term))
    );
  });

  const isModalOpen = isCreatingNew || editingItem !== null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SEO & Tracking</h1>
        </div>

        <div className="flex items-center gap-3">
          {mainTab === 'seo' ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Page SEO</span>
            </button>
          ) : (
            <button
              onClick={handleSaveGlobalScripts}
              disabled={scriptsSaving || scriptsLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {scriptsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{scriptsSaving ? 'Saving Scripts...' : 'Save Scripts'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Global Tabs Navigation (Styled exactly like Blog Published / Drafts) ── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-0 gap-4">
        <div className="flex items-center gap-6 sm:gap-8 -mb-[1px]">
          {/* Tab 1: Page SEO & Metadata */}
          <button
            type="button"
            onClick={() => handleMainTabChange('seo')}
            className={`pb-3 pt-1 text-sm transition-all duration-150 cursor-pointer relative flex items-center gap-1.5 ${
              mainTab === 'seo'
                ? 'font-bold text-slate-900 border-b-2 border-slate-900'
                : 'font-normal text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Page SEO & Metadata</span>
            <span className="text-xs text-slate-400 font-normal">{safeList.length}</span>
          </button>

          {/* Tab 2: Tracking Scripts */}
          <button
            type="button"
            onClick={() => handleMainTabChange('scripts')}
            className={`pb-3 pt-1 text-sm transition-all duration-150 cursor-pointer relative flex items-center gap-1.5 ${
              mainTab === 'scripts'
                ? 'font-bold text-slate-900 border-b-2 border-slate-900'
                : 'font-normal text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Tracking Scripts</span>
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

      {seoError && mainTab === 'seo' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{seoError}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: PAGE SEO & METADATA CONTENT
          ───────────────────────────────────────────────────────────── */}
      {mainTab === 'seo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search pages by name, route URL, or title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/30 focus:border-[#8F3EC9] text-slate-800 placeholder-slate-400"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-700">{filteredList.length}</span> pages
            </div>
          </div>

          {/* SEO Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Page Name & Route</th>
                    <th className="py-3.5 px-5">Meta Title</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {seoLoading ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8F3EC9]" />
                        Loading page metadata...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-slate-400">
                        <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-600">No page SEO configurations found.</p>
                        <button
                          onClick={handleOpenCreate}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Configure Page SEO
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => handleEditClick(item)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                        title="Click to view and configure SEO"
                      >
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-800 group-hover:text-[#8F3EC9] transition-colors">
                            {item.page_name}
                          </div>
                          <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="bg-slate-100 group-hover:bg-purple-100/70 px-1.5 py-0.5 rounded text-slate-600 transition-colors">
                              {item.route_path}
                            </span>
                            {item.page_key === 'global_default' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-purple-100 text-[#8F3EC9]">
                                Fallback Default
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5 max-w-lg">
                          <div className="font-medium text-slate-700 truncate" title={item.meta_title}>
                            {item.meta_title || <span className="text-amber-500 italic">Not set</span>}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(item);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-[#8F3EC9] hover:text-white hover:border-[#8F3EC9] transition-colors shadow-xs cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {item.page_key !== 'global_default' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-xs cursor-pointer"
                                title="Delete page SEO"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: TRACKING SCRIPTS CONTENT (DIRECT INLINE GLOBAL EDITOR)
          ───────────────────────────────────────────────────────────── */}
      {mainTab === 'scripts' && (
        <div className="space-y-6 animate-fade-in">
          {scriptsLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 shadow-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8F3EC9]" />
              Loading tracking scripts...
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1 Row 2 Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Column 1: Header Scripts (<head>) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Header Scripts</span>
                      <code className="text-[11px] font-mono bg-purple-100 text-[#8F3EC9] px-1.5 py-0.5 rounded font-normal">&lt;head&gt;</code>
                    </h3>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <textarea
                      rows={12}
                      value={globalScripts.head_script}
                      onChange={(e) => setGlobalScripts({ ...globalScripts, head_script: e.target.value })}
                      placeholder={`<!-- Google tag (gtag.js) / Meta Pixel -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXX');\n</script>`}
                      className="w-full flex-1 font-mono text-xs bg-slate-50/80 text-slate-800 p-3.5 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] leading-relaxed resize-y placeholder:text-slate-400"
                      spellCheck="false"
                    />
                  </div>
                </div>

                {/* Column 2: Body Scripts (<body>) */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>Body Scripts</span>
                      <code className="text-[11px] font-mono bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-normal">&lt;body&gt;</code>
                    </h3>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <textarea
                      rows={12}
                      value={globalScripts.body_top_script}
                      onChange={(e) => setGlobalScripts({ ...globalScripts, body_top_script: e.target.value })}
                      placeholder={`<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
                      className="w-full flex-1 font-mono text-xs bg-slate-50/80 text-slate-800 p-3.5 rounded-lg border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] leading-relaxed resize-y placeholder:text-slate-400"
                      spellCheck="false"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Row */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveGlobalScripts}
                  disabled={scriptsSaving || scriptsLoading}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {scriptsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{scriptsSaving ? 'Saving Changes...' : 'Save Tracking Scripts'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CONFIGURE PAGE SEO MODAL
          ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-slate-900">
                Configure Page SEO
              </h3>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsCreatingNew(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Styled Dropdown to Select Page */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 relative z-20">
              <span className="text-sm font-semibold text-slate-800 shrink-0">
                Select Page to Configure:
              </span>
              <div className="flex-1 max-w-sm relative">
                <button
                  type="button"
                  onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                  className="w-full px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9] shadow-2xs cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">
                    {PREDEFINED_ROUTES.find((r) => r.route_path === selectedRouteChoice)?.label || 'Select page...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${isPageDropdownOpen ? 'rotate-180 text-[#8F3EC9]' : ''}`} />
                </button>

                {isPageDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsPageDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-30 max-h-64 overflow-y-auto">
                      {PREDEFINED_ROUTES.map((route) => {
                        const isSelected = route.route_path === selectedRouteChoice;
                        return (
                          <button
                            key={route.route_path}
                            type="button"
                            onClick={() => {
                              handleRouteChoiceChange(route.route_path);
                              setIsPageDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-purple-50 text-[#8F3EC9] font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <span>{route.label}</span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#8F3EC9]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-6 text-sm font-medium">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  modalTab === 'general'
                    ? 'border-[#8F3EC9] text-[#8F3EC9] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-4 h-4" />
                General SEO
              </button>
              <button
                type="button"
                onClick={() => setModalTab('social')}
                className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  modalTab === 'social'
                    ? 'border-[#8F3EC9] text-[#8F3EC9] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Social Card (OpenGraph)
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSeoSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalTab === 'general' && (
                <div className="space-y-5">
                  {/* Meta Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Meta Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                      placeholder="e.g. Energy Autonomy — Reclaim Your Life Force & Vitality"
                      required
                    />
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Meta Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                      placeholder="Concise summary for search engines..."
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Meta Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                      placeholder="Energy coaching, vitality, burnout recovery, high performance"
                    />
                  </div>
                </div>
              )}

              {modalTab === 'social' && (
                <div className="space-y-6">
                  {/* Social Share Preview Toggle */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Social Card Settings
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSocialPreview(!showSocialPreview)}
                        className="text-xs font-medium text-[#8F3EC9] underline hover:text-[#7b32b0] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {showSocialPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    </div>

                    {showSocialPreview && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs max-w-md overflow-hidden font-sans mx-auto">
                          {formData.og_image ? (
                            <img
                              src={formData.og_image}
                              alt="Social Preview"
                              className="w-full h-44 object-cover bg-slate-100"
                            />
                          ) : (
                            <div className="w-full h-40 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-1">
                              <Eye className="w-6 h-6" />
                              <span className="text-xs">No OG Image specified</span>
                            </div>
                          )}
                          <div className="p-3.5 bg-slate-50/50">
                            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                              energyautonomy.com
                            </div>
                            <div className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">
                              {formData.og_title || formData.meta_title || 'Energy Autonomy'}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {formData.og_description || formData.meta_description || 'Discover your unique energy blueprint.'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {/* OG Image URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        OpenGraph Social Image URL
                      </label>
                      <input
                        type="url"
                        value={formData.og_image}
                        onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                        placeholder="https://energyautonomy.com/assets/og-image.png"
                      />
                    </div>

                    {/* OG Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        OG Title <span className="text-[11px] font-normal text-slate-400 normal-case ml-1">(Leave empty to inherit Meta Title)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.og_title}
                        onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                        placeholder="Custom title when shared on Facebook, WhatsApp, etc."
                      />
                    </div>

                    {/* OG Description */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        OG Description <span className="text-[11px] font-normal text-slate-400 normal-case ml-1">(Leave empty to inherit Meta Description)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.og_description}
                        onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                        placeholder="Custom snippet when shared on social networks..."
                      />
                    </div>

                    {/* Twitter Card Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Twitter Card Type
                        </label>
                        <select
                          value={formData.twitter_card}
                          onChange={(e) => setFormData({ ...formData, twitter_card: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                        >
                          <option value="summary_large_image">Summary with Large Image (Recommended)</option>
                          <option value="summary">Standard Summary</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          OpenGraph Type
                        </label>
                        <select
                          value={formData.og_type}
                          onChange={(e) => setFormData({ ...formData, og_type: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm font-normal text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8F3EC9]/20 focus:border-[#8F3EC9]"
                        >
                          <option value="website">website</option>
                          <option value="article">article</option>
                          <option value="profile">profile</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={seoSaving}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {seoSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {seoSaving ? 'Saving...' : 'Save & Publish SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DELETE MODAL
          ───────────────────────────────────────────────────────────── */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Delete Page SEO</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete the SEO configuration for <span className="font-semibold text-slate-900">"{deleteModalItem.page_name}"</span>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CUSTOM ERROR / NOTICE MODAL
          ───────────────────────────────────────────────────────────── */}
      {customError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{customError.title || 'Notification'}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {customError.message}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCustomError(null)}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[#8F3EC9] hover:bg-[#7b32b0] rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoManagementPage;
