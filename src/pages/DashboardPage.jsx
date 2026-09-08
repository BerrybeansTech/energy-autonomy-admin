import React from 'react';
import { Link } from 'react-router-dom';
import { dashboardStats, recentActivity } from '../data/blogData';
import { useBlog } from '../context/BlogContext';
import { getBlogImage } from '../data/imageAssets';

const statCardsConfig = (posts) => {
  const published = posts.filter((p) => p.status === 'published').length;
  const drafts = posts.filter((p) => p.status === 'draft').length;

  return [
    {
      label: 'Total Posts',
      value: posts.length,
      sub: 'All articles in system',
      iconBg: 'bg-purple-50 text-[#8F3EC9]',
      badge: 'Live',
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
      badge: `${Math.round((published / (posts.length || 1)) * 100)}% active`,
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
      badge: 'Unpublished',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Total Views',
      value: dashboardStats.totalViews.toLocaleString(),
      sub: `+${dashboardStats.thisMonthViews.toLocaleString()} this month`,
      iconBg: 'bg-blue-50 text-blue-600',
      badge: '+18.4%',
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
  publish: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  draft:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200/80',   dot: 'bg-amber-500' },
  edit:    { bg: 'bg-purple-50',  text: 'text-[#8F3EC9]',   border: 'border-purple-200/80',  dot: 'bg-[#8F3EC9]' },
};

const barHeights = [40, 65, 45, 85, 60, 75, 95];

const DashboardPage = () => {
  const { posts } = useBlog();
  const cards = statCardsConfig(posts);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-[#8F3EC9]">Admin</span>. Platform performance and editorial workflow.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/blog"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            All Posts ({posts.length})
          </Link>
          <Link
            to="/blog/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#8F3EC9] to-[#A06BC6] hover:from-[#7B2EB3] hover:to-[#8F3EC9] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(143,62,201,0.2)] hover:shadow-[0_4px_15px_rgba(143,62,201,0.3)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
            </svg>
            Write Post
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <span className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {card.icon}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 shadow-xs">
                {card.badge}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 font-medium">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Activity Feed</h2>
              <p className="text-xs text-slate-400">Latest changes to blog articles</p>
            </div>
            <Link
              to="/blog"
              className="text-xs font-bold text-[#8F3EC9] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentActivity.map((item) => {
              const c = activityConfig[item.type] || activityConfig.edit;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-all group"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider ${c.bg} ${c.text} ${c.border}`}>
                    {item.action}
                  </span>
                  <p className="text-xs font-bold text-slate-800 flex-1 truncate group-hover:text-[#8F3EC9] transition-colors">
                    {item.title}
                  </p>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Read Time Mini-Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-300 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Avg. Read Time
              </span>
              <span className="text-xs font-black text-[#8F3EC9] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                {dashboardStats.avgReadTime}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Average reader dwell time</p>
          </div>

          <div className="pt-6">
            <div className="flex items-end gap-2 h-20">
              {barHeights.map((h, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-[#8F3EC9] to-[#FE9B40] opacity-80 group-hover:opacity-100 transition-all"
                    style={{ height: `${h}%` }}
                    title={`Day ${idx + 1}: ${h}%`}
                  />
                  <span className="text-[9px] font-bold text-slate-400">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Posts Table (Clean, Fits Normal Screens) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Blog Posts</h2>
            <p className="text-xs text-slate-400">Latest active posts in your catalog</p>
          </div>
          <Link
            to="/blog"
            className="text-xs font-bold text-[#8F3EC9] hover:underline"
          >
            Manage all posts →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-5">Article</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Date</th>
                <th className="py-2.5 px-5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {posts.slice(0, 5).map((post) => (
                <tr
                  key={post.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={getBlogImage(post.image)}
                        alt={post.title}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                      />
                      <div className="min-w-0 max-w-sm">
                        <Link
                          to={`/blog/view/${post.id}`}
                          className="font-bold text-slate-900 group-hover:text-[#8F3EC9] transition-colors truncate block text-xs"
                        >
                          {post.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-[#8F3EC9] border border-purple-100">
                      {post.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        post.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                    {post.publishedAt}
                  </td>

                  <td className="py-3 px-5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1">
                      <Link
                        to={`/blog/view/${post.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="View Article"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link
                        to={`/blog/edit/${post.id}`}
                        className="p-1.5 text-slate-400 hover:text-[#8F3EC9] hover:bg-purple-50 rounded-md transition-colors"
                        title="Edit Article"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
