import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { assessmentApi } from '../services/api';
import { QUIZ_QUESTIONS, GENIE_METADATA, getGenieMeta } from '../data/assessmentQuestions';
import { ConfirmationModal, Pagination } from '../components/common';

export default function AssessmentResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ results: [], total: 0, totalPages: 1, stats: null });
  const [search, setSearch] = useState('');
  const [selectedGenie, setSelectedGenie] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Detail View State (Full Page View, No Floating Popups with empty margins)
  const [selectedResult, setSelectedResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assessmentApi.getAll({
        page,
        limit,
        search,
        genie: selectedGenie,
        sortBy,
        order: sortOrder,
      });
      if (res && res.success) {
        setData(res);
        // If there's an id in URL, sync selectedResult
        const urlId = searchParams.get('id');
        if (urlId && res.results) {
          const found = res.results.find((r) => String(r.id) === String(urlId));
          if (found) setSelectedResult(found);
        }
      }
    } catch (err) {
      console.error('Failed to load assessment results:', err);
      showToast('Error loading assessments: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedGenie, sortBy, sortOrder, searchParams]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleOpenDetail = (row) => {
    setSelectedResult(row);
    setSearchParams({ id: row.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedResult(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const blob = await assessmentApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Assessment submissions exported to CSV successfully');
    } catch (err) {
      showToast('Failed to export CSV: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await assessmentApi.delete(deleteTarget.id);
      showToast('Assessment submission deleted successfully');
      setDeleteTarget(null);
      setOpenMenuId(null);
      if (selectedResult?.id === deleteTarget.id) {
        setSelectedResult(null);
        setSearchParams({});
      }
      fetchResults();
    } catch (err) {
      showToast('Failed to delete: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyResultUrl = (record) => {
    const userName = record?.name || 'Valued Seeker';
    const genieKey = (record?.genieType || record?.genie_type || 'pure').toLowerCase();
    const resultId = record?.resultId || record?.result_id || record?.id;
    const url = `https://energyautonomy.com/quiz?result=${genieKey}&name=${encodeURIComponent(userName)}&id=${encodeURIComponent(resultId)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Personalized result URL copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Helper date formatter matching dashboard pattern
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const stats = data.stats || {
    total: data.total || 0,
    today: 0,
    byGenie: { armoured: 0, pure: 0, confused: 0, accidental: 0, conscious: 0 },
  };

  const dominantOverall = useMemo(() => {
    if (!stats.byGenie) return 'Armoured Genie';
    const sorted = Object.entries(stats.byGenie).sort((a, b) => b[1] - a[1]);
    const topKey = sorted[0]?.[0] || 'pure';
    return getGenieMeta(topKey).name;
  }, [stats]);

  // Stat cards aligned with Dashboard stat card pattern (Professional admin line icons)
  const statCards = [
    {
      label: 'TOTAL SUBMISSIONS',
      value: stats.total || 0,
      sub: 'Completed quiz evaluations',
      iconBg: 'bg-purple-50 text-[#8F3EC9]',
      accentGradient: 'from-purple-500 to-violet-500',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      label: 'SUBMITTED TODAY',
      value: stats.today || 0,
      sub: 'Last 24 hours',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentGradient: 'from-emerald-500 to-teal-500',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'TOP DOMINANT GENIE',
      value: dominantOverall,
      sub: 'Most common archetype',
      iconBg: 'bg-amber-50 text-amber-600',
      accentGradient: 'from-amber-500 to-orange-500',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: 'RESULTS DELIVERED',
      value: `${(stats.total || 0) > 0 ? '100%' : '0%'}`,
      sub: 'Evaluations dispatched to user',
      iconBg: 'bg-indigo-50 text-indigo-600',
      accentGradient: 'from-indigo-500 to-purple-600',
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // VIEW MODE: FULL-WIDTH ASSESSMENT REPORT PAGE VIEW (NO POPUP MODAL)
  // ══════════════════════════════════════════════════════════════════════
  if (selectedResult) {
    const genieKey = (
      selectedResult.genieType ||
      selectedResult.genie_type ||
      'pure'
    ).toLowerCase();
    const meta = getGenieMeta(genieKey);
    const scores = selectedResult.scores || {};
    const answers = selectedResult.answers || {};

    return (
      <div className="w-full space-y-6 animate-fade-in text-slate-900 pb-12">
        {/* Floating Toast Notification (Top Right) */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Top Bar: Back Button + Page Heading + Quick Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={handleBackToList}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#8F3EC9] transition-all bg-white shadow-2xs shrink-0 cursor-pointer"
              title="Back to All Submissions"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Assessment Report
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                  <span>{meta.name}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation for <strong className="text-slate-800 font-semibold">{selectedResult.name || 'Valued Seeker'}</strong> ({selectedResult.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setDeleteTarget(selectedResult)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 shadow-2xs transition-colors cursor-pointer"
              title="Delete Submission"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* ── 1. Hero User & Dominant Archetype Banner ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-slate-100">
              <img
                src={meta.imageUrl}
                alt={meta.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedResult.name || 'Valued Seeker'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.badgeClass}`}
                >
                  <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                  <span>{meta.name}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedResult.email}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDate(selectedResult.createdAt || selectedResult.created_at)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Dispatch
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200/80 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Delivered (Sent)</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Archetype Profile (Challenge, Motivation, Strength) ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-purple-50/80 via-slate-50 to-amber-50/40 border border-purple-100/80">
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium italic border-l-4 border-[#8F3EC9] pl-4">
              "{meta.description}"
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="font-bold text-[#8F3EC9] uppercase tracking-wider text-[11px] mb-1.5">
                Core Challenge
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{meta.challenge}</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="font-bold text-amber-600 uppercase tracking-wider text-[11px] mb-1.5">
                Key Motivation
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{meta.motivation}</p>
            </div>
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <p className="font-bold text-emerald-600 uppercase tracking-wider text-[11px] mb-1.5">
                Primary Strength
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{meta.strength}</p>
            </div>
          </div>
        </div>

        {/* ── 3. Archetype Scores Distribution ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[#8F3EC9]" />
              <span>Archetype Scores Distribution</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Total 20 Questions</span>
          </div>

          <div className="space-y-3 p-5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            {Object.keys(GENIE_METADATA).map((k) => {
              const gMeta = GENIE_METADATA[k];
              const score = scores[k] ?? 0;
              const pct = Math.round((score / 20) * 100);
              const isDominant = k === genieKey;

              return (
                <div key={k} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold flex items-center gap-2 ${
                        isDominant ? 'text-[#8F3EC9] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${gMeta.dotClass}`} />
                      <span>{gMeta.name}</span>
                      {isDominant && (
                        <span className="text-[10px] bg-purple-100 text-[#8F3EC9] px-2 py-0.5 rounded-full font-bold">
                          DOMINANT
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-600 font-medium">
                      {score} / 20 ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${gMeta.barClass}`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. Full 20 Questions Review ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-[#8F3EC9]" />
              <span>Question by Question Review (20)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Recorded Submissions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUIZ_QUESTIONS.map((q) => {
              const chosenGenie =
                answers[q.id - 1] ||
                answers[q.id] ||
                answers[String(q.id - 1)] ||
                answers[String(q.id)];
              const chosenOption = q.options.find(
                (opt) => opt.genie.toLowerCase() === (chosenGenie || '').toLowerCase()
              );
              const optMeta = chosenGenie ? getGenieMeta(chosenGenie) : null;

              return (
                <div
                  key={q.id}
                  className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl hover:border-purple-300 transition-colors text-xs space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900 leading-snug">
                      <span className="text-[#8F3EC9] font-bold mr-1.5">Q{q.id}.</span>
                      {q.question}
                    </p>
                    {optMeta && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${optMeta.badgeClass}`}
                      >
                        {optMeta.name}
                      </span>
                    )}
                  </div>

                  <div className="pl-3.5 border-l-2 border-purple-400 py-1.5 text-slate-700 bg-white rounded-r-lg border border-slate-100">
                    {chosenOption ? (
                      <p className="flex items-start gap-2 font-medium text-slate-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{chosenOption.text}</span>
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No answer recorded</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 6. Bottom Navigation Bar ── */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Submissions</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteTarget(selectedResult)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete This Record</span>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Assessment Submission"
          message={
            deleteTarget
              ? `Are you sure you want to permanently delete the assessment record for "${
                  deleteTarget.name || 'Valued Seeker'
                }" (${deleteTarget.email})? This action cannot be undone.`
              : ''
          }
          confirmText="Delete Permanently"
          cancelText="Cancel"
          type="danger"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // LIST MODE: SUBMISSIONS TABLE & STATS (MATCHING DASHBOARD & BLOGS)
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-7 animate-fade-in text-slate-900">
      {/* ── Global Floating Toast Notification (Top Right) ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-200 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Page Header: Title ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Assessment Results
        </h1>
        <p className="text-sm text-slate-600 font-medium mt-1">
          Review user quiz submissions, dominant Genie identities, and detailed evaluations.
        </p>
      </div>

      {/* ── Stat Cards (Consistent 4-grid matching Dashboard) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden animate-fade-in-up h-full"
          >
            {/* Accent gradient bar at top */}
            <div
              className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-slate-50/80 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <span
                className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}
              >
                {card.icon}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-slate-900 tracking-tight truncate">
                {loading ? (
                  <span className="inline-block w-8 h-8 bg-slate-100 rounded-md animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>{card.sub}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Submissions Table Container (Matching Dashboard & Blog Cards) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {/* Card Header + Search & Sort */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quiz Submissions</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Detailed user archetype results & evaluations
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
                className="w-48 sm:w-60 pl-8 pr-7 py-1.5 text-xs bg-white hover:bg-slate-50/80 focus:bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:border-[#8F3EC9] transition-all font-normal placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Archetype Quick Filter Tabs (Single clean row, no duplicate dropdowns) */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Filter:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedGenie('all');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedGenie === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[11px] ${
                selectedGenie === 'all' ? 'text-slate-300' : 'text-slate-400'
              }`}
            >
              ({stats.total || 0})
            </span>
          </button>

          {Object.keys(GENIE_METADATA).map((key) => {
            const meta = GENIE_METADATA[key];
            const count = stats.byGenie?.[key] || 0;
            const isSelected = selectedGenie === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedGenie(key);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-purple-100 text-[#8F3EC9] border border-[#8F3EC9]/30 shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                <span>{meta.name}</span>
                <span className="text-[11px] text-slate-400 font-normal">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Content Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="px-5 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-5 sm:px-6">User</th>
                <th className="py-3 px-4">Dominant Genie</th>
                <th className="py-3 px-4 hidden md:table-cell">Date & Time</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-slate-200 rounded" />
                          <div className="w-40 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-28 h-6 bg-slate-200 rounded-lg" />
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-16 h-5 bg-slate-200 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-5 sm:px-6 text-right">
                      <div className="w-16 h-7 bg-slate-200 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data.results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#8F3EC9] flex items-center justify-center mb-3 border border-purple-100">
                        <ClipboardCheck className="w-6 h-6 opacity-60" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        No assessment results found
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search || selectedGenie !== 'all'
                          ? 'Try adjusting your search query or Genie filter.'
                          : 'As soon as users complete the quiz, their evaluations will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.results.map((row) => {
                  const genieKey = (row.genieType || row.genie_type || 'pure').toLowerCase();
                  const meta = getGenieMeta(genieKey);
                  const initial = (row.name?.[0] || row.email?.[0] || 'U').toUpperCase();
                  const isMenuOpen = openMenuId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenDetail(row)}
                      className="hover:bg-purple-50/20 transition-colors group cursor-pointer"
                    >
                      {/* 1. User Info */}
                      <td className="py-3.5 px-5 sm:px-6">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span
                              className="font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors truncate block text-xs"
                              title={row.name}
                            >
                              {row.name || 'Valued Seeker'}
                            </span>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{row.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Dominant Genie */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${meta.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          <span>{meta.name}</span>
                        </span>
                      </td>

                      {/* 3. Submitted Date & Time */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {formatDate(row.createdAt || row.created_at)}
                      </td>

                      {/* 4. Delivery Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>SENT</span>
                        </span>
                      </td>

                      {/* 5. Professional Actions Menu */}
                      <td
                        className="py-3.5 px-5 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(row);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#8F3EC9] bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                            title="View Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* 3-Dots Action Dropdown Menu */}
                          <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(isMenuOpen ? null : row.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Submission options"
                            >
                              <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                              </svg>
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-scale-in origin-top-right text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    handleOpenDetail(row);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span>View Full Report</span>
                                </button>


                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setDeleteTarget(row);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-normal text-rose-600 hover:bg-rose-50/80 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                                  <span>Delete Record</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized Common Pagination */}
        <Pagination
          currentPage={page}
          totalPages={data.totalPages || 1}
          totalItems={data.total || 0}
          pageSize={limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Standardized Common Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Assessment Submission"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete the assessment record for "${
                deleteTarget.name || 'Valued Seeker'
              }" (${deleteTarget.email})? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
