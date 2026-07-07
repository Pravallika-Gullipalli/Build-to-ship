import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import Card from '../components/Card';
import { 
  Building2, 
  Users, 
  Layers, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Star,
  Activity
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Query analytics summary via TanStack Query
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsService.getAnalyticsSummary()
  });

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-900 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* High-Level Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Reports logged</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.totalComplaints}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Cumulative database total</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Layers size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.resolvedComplaints}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">SLA resolution count</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Complaints</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.pendingComplaints}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Open in dispatch boards</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Activity size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Duplicate Warnings</p>
            <h3 className="text-2xl font-black text-violet-400 mt-1">{stats.duplicateComplaints}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Incidents merged by geofence</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </Card>
      </div>

      {/* Grid: Department Performance List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Department stats table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="px-2 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-blue-500" />
              Municipal Department Ratings
            </h3>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xxs text-blue-400 hover:text-blue-300 font-bold uppercase flex items-center gap-0.5"
            >
              Full Charts &rarr;
            </button>
          </div>

          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-0 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="p-4 font-bold">Department Name</th>
                    <th className="p-4 font-bold text-center">Total Assigned</th>
                    <th className="p-4 font-bold text-center">Resolved</th>
                    <th className="p-4 font-bold text-center">Avg Days</th>
                    <th className="p-4 font-bold text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {stats.departmentPerformance.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-semibold text-slate-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {dept.department}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-300">{dept.total}</td>
                      <td className="p-4 text-center font-bold text-slate-300">{dept.resolved}</td>
                      <td className="p-4 text-center font-bold text-slate-300 flex items-center justify-center gap-1">
                        <Clock size={12} className="text-slate-500" />
                        {dept.avgResolutionDays}d
                      </td>
                      <td className="p-4 text-right font-bold text-amber-400">
                        <span className="inline-flex items-center gap-0.5">
                          {dept.rating}
                          <Star size={10} className="fill-amber-400" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Efficiency parameters */}
        <div className="flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              System AI Health
            </h3>
            
            <div className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Automated Audit Match:</span>
                <span className="text-white bg-slate-800/60 border border-slate-700 px-2 py-0.5 rounded">
                  {stats.aiVerificationRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Turnaround:</span>
                <span className="text-white">
                  {stats.avgResolutionTimeDays} Days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Geofence Duplicates:</span>
                <span className="text-violet-400">
                  {stats.duplicateComplaints} Intercepted
                </span>
              </div>
            </div>
          </Card>

          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3">
              Administrative Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full text-left text-xxs font-bold uppercase px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all flex items-center justify-between"
              >
                Manage Staff Users
                <TrendingUp size={12} className="text-slate-500" />
              </button>
              <button
                onClick={() => navigate('/admin/ai-logs')}
                className="w-full text-left text-xxs font-bold uppercase px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all flex items-center justify-between"
              >
                Inspect AI Model Logs
                <TrendingUp size={12} className="text-slate-500" />
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default AdminDashboard;
