import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';

const statCardsConfig = (posts) => {
  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;

  return [
    {
      label: 'Total Posts',
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
      label: 'Published',
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
      label: 'Drafts',
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

const activityConfig = {
  publish: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500', icon: '✓' },
  draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500', icon: '◎' },
  edit: { bg: 'bg-purple-50', text: 'text-[#8F3EC9]', border: 'border-purple-200/80', dot: 'bg-[#8F3EC9]', icon: '✎' },
};

const DashboardPage = () => {
  const { posts, loading } = useBlog();
  const cards = statCardsConfig(posts);

  // Derive recent activity dynamically from real posts
  const recentActivity = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 6)
      .map((p) => {
        const isPublished = p.status === 'published';
        return {
          id: p.id,
          action: isPublished ? 'Published' : 'Drafted',
          title: p.title,
          time: p.publishedAt ? `Updated ${p.publishedAt}` : 'Recently',
          type: isPublished ? 'publish' : 'draft',
        };
      });
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

      {/* ── Recent Activity Feed ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-md transition-shadow duration-300 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Latest blog articles from database</p>
          </div>
          <Link
            to="/blog"
            className="flex items-center gap-1.5 text-xs font-bold text-[#8F3EC9] hover:underline px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs font-medium">No posts in the system yet.</p>
            <Link
              to="/blog/create"
              className="mt-2 inline-block text-xs font-semibold text-[#8F3EC9] hover:underline"
            >
              Write your first blog post →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item, idx) => {
              const c = activityConfig[item.type] || activityConfig.edit;
              return (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100/80 hover:bg-slate-50/70 transition-all group animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 uppercase tracking-wider ${c.bg} ${c.text} ${c.border}`}>
                    {item.action}
                  </span>
                  <Link
                    to={`/blog/view/${item.id}`}
                    className="text-xs font-semibold text-slate-800 flex-1 truncate group-hover:text-[#8F3EC9] transition-colors"
                  >
                    {item.title}
                  </Link>
                  <span className="text-[11px] text-slate-500 shrink-0 font-semibold">{item.time}</span>
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
