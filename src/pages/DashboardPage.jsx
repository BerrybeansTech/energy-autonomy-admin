import React from 'react';
import { Link } from 'react-router-dom';
import { recentActivity, weeklyViewsData, topPerformingPosts } from '../data/blogData';
import { useBlog } from '../context/BlogContext';

const statCardsConfig = (posts) => {
  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  return [
    {
      label: 'Total Posts',
      value: posts.length,
      sub: 'All articles in system',
      change: '+2 this month',
      changePositive: true,
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
      change: `${Math.round((published / posts.length) * 100)}% publish rate`,
      changePositive: true,
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
      change: 'Awaiting review',
      changePositive: false,
      iconBg: 'bg-amber-50 text-amber-600',
      accentGradient: 'from-amber-500 to-orange-500',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      sub: 'All-time page views',
      change: '+18% vs last month',
      changePositive: true,
      iconBg: 'bg-sky-50 text-sky-600',
      accentGradient: 'from-sky-500 to-blue-500',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

const MiniBarChart = ({ data }) => {
  const maxVal = Math.max(...data.map(d => d.views));
  return (
    <div className="flex items-end gap-1.5 h-20 mt-3">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-[#8F3EC9] to-[#c084fc] mini-bar opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group"
            style={{ height: `${(item.views / maxVal) * 100}%`, minHeight: '8px' }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {item.views}
            </div>
          </div>
          <span className="text-[9px] font-bold text-slate-500">{item.day}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const { posts } = useBlog();
  const cards = statCardsConfig(posts);

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Welcome back, <span className="font-bold text-[#8F3EC9]">Admin</span>. Here's your editorial performance at a glance.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
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
              <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80">
              <p className="text-[11px] text-slate-500 font-semibold">{card.sub}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                card.changePositive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Chart + Top Posts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Weekly Views Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Weekly Page Views</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Last 7 days traffic overview</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[11px] font-bold">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              +14.3%
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900">
              {weeklyViewsData.reduce((s, d) => s + d.views, 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">total views</span>
          </div>

          <MiniBarChart data={weeklyViewsData} />
        </div>

        {/* Top Performing Posts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Performers</h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Highest viewed articles</p>
            </div>
            <span className="text-[10px] font-bold text-[#8F3EC9] bg-purple-50 px-2 py-0.5 rounded-md">
              All Time
            </span>
          </div>

          <div className="space-y-3">
            {topPerformingPosts.map((post, idx) => (
              <Link
                key={post.id}
                to={`/blog/view/${post.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-purple-50/30 hover:border-purple-100 transition-all group"
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  idx === 0 ? 'bg-gradient-to-br from-[#8F3EC9] to-[#FE9B40] text-white shadow-sm' :
                  idx === 1 ? 'bg-slate-100 text-slate-600' :
                  'bg-slate-50 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#8F3EC9] transition-colors">
                    {post.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold">{post.views.toLocaleString()} views</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      ↑{post.growth}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 hover:shadow-md transition-shadow duration-300 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Latest changes to blog articles</p>
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

        <div className="space-y-2">
          {recentActivity.map((item, idx) => {
            const c = activityConfig[item.type] || activityConfig.edit;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100/80 hover:bg-slate-50/70 transition-all group animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 uppercase tracking-wider ${c.bg} ${c.text} ${c.border}`}>
                  {item.action}
                </span>
                <p className="text-xs font-semibold text-slate-800 flex-1 truncate group-hover:text-[#8F3EC9] transition-colors">
                  {item.title}
                </p>
                <span className="text-[11px] text-slate-500 shrink-0 font-semibold">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Access Footer ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/blog/create"
          className="p-5 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100/60 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-[#8F3EC9] mb-3 group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors">Create Article</h3>
          <p className="text-[11px] text-slate-500 mt-1">Write and publish new content</p>
        </Link>

        <Link
          to="/blog"
          className="p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100/60 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Manage Library</h3>
          <p className="text-[11px] text-slate-500 mt-1">Browse and edit all blog posts</p>
        </Link>

        <Link
          to="/write-blog"
          className="p-5 bg-gradient-to-br from-orange-50/80 to-amber-50/50 border border-orange-100/60 rounded-2xl hover:border-orange-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">Rich Editor</h3>
          <p className="text-[11px] text-slate-500 mt-1">Open full-featured story editor</p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
