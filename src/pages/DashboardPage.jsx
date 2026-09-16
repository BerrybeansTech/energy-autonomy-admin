import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';
import {
  Image as ImageIcon,
  ArrowRight,
} from 'lucide-react';

const statCardsConfig = (posts) => {
  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;

  return [
    {
      label: 'TOTAL POSTS',
      value: posts.length,
      sub: 'All articles in system',
      iconBg: 'bg-purple-50 text-[#8F3EC9]',
      accentGradient: 'from-purple-500 to-violet-500',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      label: 'PUBLISHED',
      value: published,
      sub: 'Live on website',
      iconBg: 'bg-emerald-50 text-emerald-600',
      accentGradient: 'from-emerald-500 to-teal-500',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'DRAFTS',
      value: drafts,
      sub: 'In preparation',
      iconBg: 'bg-amber-50 text-amber-600',
      accentGradient: 'from-amber-500 to-orange-500',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];
};

/**
 * Thumbnail component with graceful fallback if image fails to load
 */
const ArticleThumbnail = ({ src, title }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100/80 shrink-0 flex items-center justify-center text-[#8F3EC9]">
        <ImageIcon className="w-5 h-5 opacity-40" />
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0 flex items-center justify-center">
      <img
        src={src}
        alt={title || 'Cover'}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};

const DashboardPage = () => {
  const { posts, loading, fetchPosts } = useBlog();
  const cards = statCardsConfig(posts);

  // Auto-fetch fresh statistics from API on mount and window focus
  useEffect(() => {
    if (fetchPosts) {
      fetchPosts();
    }
    const handleFocus = () => {
      if (fetchPosts) {
        fetchPosts();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchPosts]);

  // Derive recent activity dynamically with rich post attributes
  const recentActivity = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 8);
  }, [posts]);

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Welcome to <span className="font-bold text-[#8F3EC9]">Energy Autonomy Admin</span>. Here's your live editorial performance at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            View All
          </Link>
          <Link
            to="/blog/create"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] hover:from-[#7B2EB3] hover:to-[#8F3EC9] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-300/20 hover:shadow-xl hover:shadow-purple-300/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            New Blog Post
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden animate-fade-in-up"
          >
            {/* Accent gradient bar at top */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-slate-50/80 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <span className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {loading ? <span className="inline-block w-8 h-8 bg-slate-100 rounded-md animate-pulse" /> : card.value}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100/80">
              <p className="text-[11px] text-slate-500 font-semibold">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Activity Section (Updated First, Article Center, Status Last) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Latest blog articles from database
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8F3EC9] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content Table Header */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex-1 min-w-0">Article</span>
          <span className="w-36 sm:w-44 shrink-0 text-center">Updated</span>
          <span className="w-28 sm:w-32 shrink-0 text-right">Status</span>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-semibold text-slate-700">No articles in the system yet.</p>
            <Link
              to="/blog/create"
              className="mt-2 inline-block text-xs font-bold text-[#8F3EC9] hover:underline"
            >
              Write your first blog post →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {recentActivity.map((post) => {
              const isPub = post.status === 'published';
              const coverImg = getBlogImage(post.image || post.featuredImage);
              const dateStr = post.publishedAt
                ? `Updated ${post.publishedAt}`
                : (post.updatedAt
                    ? `Updated ${new Date(post.updatedAt).toISOString().split('T')[0]}`
                    : 'Updated recently');

              return (
                <div
                  key={post.id}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-purple-50/20 transition-colors group"
                >
                  {/* 1. ARTICLE (First on Left) */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <ArticleThumbnail src={coverImg} title={post.title} />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/blog/view/${post.id}`}
                        className="font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors truncate block text-xs"
                        title={post.title}
                      >
                        {post.title || 'Untitled Blog Post'}
                      </Link>
                      {post.excerpt && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. UPDATED (Center) */}
                  <div className="w-36 sm:w-44 shrink-0 text-center text-[11px] font-semibold text-slate-500">
                    {dateStr}
                  </div>

                  {/* 3. STATUS (Last on Right) */}
                  <div className="w-28 sm:w-32 shrink-0 flex justify-end">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                        isPub
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-amber-50 text-amber-700 border-amber-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPub ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{isPub ? 'PUBLISHED' : 'DRAFT'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
