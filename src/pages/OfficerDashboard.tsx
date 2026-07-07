import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { complaintService } from '../services/complaintService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import MapComponent from '../components/MapComponent';
import { 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  TrendingUp
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Query officer complaints
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['officer-complaints', user?.id],
    queryFn: () => complaintService.filterComplaints({ assignedOfficerId: user?.id }),
    enabled: !!user?.id
  });

  const totalAssigned = complaints?.length || 0;
  const criticalCount = complaints?.filter(c => c.priority === 'critical' && c.status !== 'resolved').length || 0;
  const inProgressCount = complaints?.filter(c => c.status === 'work_started').length || 0;
  const completedCount = complaints?.filter(c => c.status === 'resolved').length || 0;

  // Filter out resolved from the active list
  const activeQueue = complaints?.filter(c => c.status !== 'resolved') || [];
  
  // Sort queue: critical first, then high, then medium, then low
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedQueue = [...activeQueue].sort((a, b) => 
    (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-28 bg-slate-900 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 rounded-2xl" />
          <div className="h-96 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Officer Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Assigned</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalAssigned}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Assigned to my sector</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Critical Alerts</p>
            <h3 className="text-2xl font-black text-rose-500 mt-1">{criticalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Requires immediate attention</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Repairs</p>
            <h3 className="text-2xl font-black text-cyan-500 mt-1">{inProgressCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Crews currently dispatched</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <Play size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">{completedCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Marked closed by me</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Assigned Queue list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
              Priority Work Queue
            </h3>
            <span className="text-xxs text-slate-400 font-bold uppercase">
              {activeQueue.length} Active Tickets
            </span>
          </div>

          {sortedQueue.length > 0 ? (
            <div className="flex flex-col gap-4">
              {sortedQueue.map(c => (
                <Card
                  key={c.id}
                  onClick={() => navigate(`/complaints/${c.id}`)}
                  className="cursor-pointer border-slate-800/60 hover:border-slate-700/60 bg-slate-900/20 p-5 flex flex-col sm:flex-row gap-4"
                >
                  {c.imageUrl && (
                    <img
                      src={c.imageUrl}
                      alt={c.title}
                      className="w-full sm:w-28 h-28 sm:h-20 object-cover rounded-xl border border-slate-800"
                    />
                  )}
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-sm sm:text-base text-white hover:text-blue-400 transition-colors">
                          {c.title}
                        </h4>
                        <div className="flex gap-1 shrink-0 scale-90 sm:scale-100 origin-right">
                          <Badge type="priority" value={c.priority} />
                          <Badge type="status" value={c.status} />
                        </div>
                      </div>
                      <p className="text-xxs text-slate-400 font-bold text-blue-400 mt-0.5 uppercase tracking-wide">
                        {c.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-3 text-xxs text-slate-400">
                      <span className="flex items-center gap-1 font-semibold truncate max-w-[60%]">
                        <MapPin size={12} className="text-slate-500" />
                        {c.location.address}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card hoverable={false} className="border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
              <h4 className="font-semibold text-sm text-slate-400">All Clear!</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                You have no active complaints assigned to your sector queue. High-priority items will pop up here when submitted.
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Dispatch Sector Map & Stats */}
        <div className="flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-4">
              My Sector Dispatch Map
            </h3>
            <div className="h-64 rounded-xl overflow-hidden">
              <MapComponent
                complaints={activeQueue}
                zoom={12}
                interactive={true}
              />
            </div>
          </Card>
          
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-4">
              Duty Guidelines
            </h3>
            <div className="flex flex-col gap-3 text-xxs text-slate-400 leading-relaxed font-semibold">
              <p className="flex gap-2">
                <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                Critical issues must be self-assigned and investigated within 1 hour.
              </p>
              <p className="flex gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                Ensure all pavement sealing works are documented with photographic updates.
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default OfficerDashboard;
