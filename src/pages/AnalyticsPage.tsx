import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import Card from '../components/Card';
import { BarChart3, TrendingUp, ShieldAlert, Award, Clock } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  // Query analytics aggregates via TanStack Query
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system-analytics-page'],
    queryFn: () => analyticsService.getAnalyticsSummary()
  });

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900 rounded-2xl" />
          <div className="h-80 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate highest category for text insight
  const maxCategory = [...stats.categoryDistribution].sort((a, b) => b.count - a.count)[0]?.category || 'Roads';

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">City Analytics Command Panel</h2>
        <p className="text-xs text-slate-400">Review real-time metrics on civic ticket volume, resolution trends, and department scores</p>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Trend Chart - Custom SVG */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-1.5 justify-between border-b border-slate-800/60 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-400" />
              Monthly Complaint Load (Filed vs Resolved)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Past 6 Months</span>
          </div>

          {/* Simple Vector Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-6 pt-6 relative">
            {/* Grid Line Marks */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[9px] text-slate-600 font-semibold">
              <div className="border-b border-slate-800/60 w-full pt-1"><span>30 Reports</span></div>
              <div className="border-b border-slate-800/60 w-full pt-1"><span>20 Reports</span></div>
              <div className="border-b border-slate-800/60 w-full pt-1"><span>10 Reports</span></div>
              <div className="w-full"></div>
            </div>

            {stats.monthlyTrend.map((t, idx) => {
              // Scale values to fit max 30 reports limit in chart height
              const submittedHeight = `${Math.min(100, (t.submitted / 30) * 100)}%`;
              const resolvedHeight = `${Math.min(100, (t.resolved / 30) * 100)}%`;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative z-10">
                  {/* Bars side-by-side */}
                  <div className="flex items-end gap-1.5 w-full h-[85%]">
                    {/* Submitted Bar */}
                    <div 
                      style={{ height: submittedHeight }}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md hover:brightness-110 hover:shadow-glow-blue transition-all cursor-pointer relative group"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-xxs px-2 py-0.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white font-bold">
                        Filed: {t.submitted}
                      </div>
                    </div>

                    {/* Resolved Bar */}
                    <div 
                      style={{ height: resolvedHeight }}
                      className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md hover:brightness-110 hover:shadow-glow-emerald transition-all cursor-pointer relative group"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-xxs px-2 py-0.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white font-bold">
                        Resolved: {t.resolved}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-bold uppercase">{t.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 mt-2 text-xxs font-semibold">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded bg-blue-500" />
              Complaints Submitted
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              Complaints Resolved
            </span>
          </div>
        </Card>

        {/* Priority Spread - Custom Visual indicators */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-1.5 justify-between border-b border-slate-800/60 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-400" />
              Priority Severity Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Volume Spread</span>
          </div>

          <div className="flex flex-col gap-5 justify-center h-56 pt-2">
            {stats.priorityDistribution.map((p, idx) => {
              const maxCount = Math.max(...stats.priorityDistribution.map(x => x.count));
              const pctWidth = maxCount > 0 ? `${(p.count / maxCount) * 100}%` : '0%';

              return (
                <div key={idx} className="flex flex-col gap-1.5 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.priority}
                    </span>
                    <span className="text-white font-bold">{p.count} case{p.count !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {/* Glowing progress line */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div 
                      style={{ width: pctWidth, backgroundColor: p.color }}
                      className="h-full rounded-full transition-all duration-500 shadow-md"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Grid: Category counts and Turnaround SLA details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Category stats panel */}
        <Card hoverable={false} className="md:col-span-2 border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-500" />
            Active Category Incidents
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {stats.categoryDistribution.map((c, idx) => (
              <div key={idx} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{c.category}</span>
                <span className="text-white font-black bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {c.count} Active
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* SLA and efficiency scores */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-2">
            <Award size={14} className="text-emerald-400" />
            Performance Insights
          </h3>

          <div className="flex flex-col gap-4 text-xs font-semibold leading-relaxed">
            <div className="flex gap-2">
              <Clock size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300">Average Turnaround SLA</p>
                <p className="text-xxs text-slate-400 mt-0.5">Municipal repairs average {stats.avgResolutionTimeDays} days from file date to resolution seal.</p>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-800/40 pt-3">
              <TrendingUp size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300">Highest Volume Category</p>
                <p className="text-xxs text-slate-400 mt-0.5">Tickets related to {maxCategory} represents the bulk of active incidents reported this month.</p>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};
export default AnalyticsPage;
