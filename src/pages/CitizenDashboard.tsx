import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { complaintService } from '../services/complaintService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { FileText, Plus, AlertCircle, CheckCircle2, Clock, MapPin, Activity } from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Query citizen complaints via TanStack Query
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['my-complaints', user?.id],
    queryFn: () => complaintService.filterComplaints({ 
      reporterId: user?.id,
      reporterName: user?.name 
    }),
    enabled: !!user?.id
  });

  const totalReports = complaints?.length || 0;
  const resolvedReports = complaints?.filter(c => c.status === 'resolved').length || 0;
  const activeReports = totalReports - resolvedReports;

  // Render Skeleton while loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-900/50 rounded-2xl border border-slate-800/80" />
          ))}
        </div>
        <div className="h-64 bg-slate-900/50 rounded-2xl border border-slate-800/80" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Complaints Filed</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalReports}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Assigned to municipal tracking</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <FileText size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Complaints</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">{activeReports}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Currently under review or active repair</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </Card>

        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex items-center justify-between">
          <div>
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Resolved Issues</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{resolvedReports}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Marked complete by field agents</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </Card>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Complaints List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={16} className="text-blue-500 animate-pulse" />
              My Reported Cases
            </h3>
            <Link
              to="/citizen/report"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xxs uppercase px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus size={14} />
              New Report
            </Link>
          </div>

          {complaints && complaints.length > 0 ? (
            <div className="flex flex-col gap-4">
              {complaints.map(complaint => (
                <Card
                  key={complaint.id}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                  className="cursor-pointer border-slate-800/60 hover:border-slate-700/60 bg-slate-900/20 p-5 flex flex-col sm:flex-row gap-4"
                >
                  {complaint.imageUrl && (
                    <img
                      src={complaint.imageUrl}
                      alt={complaint.title}
                      className="w-full sm:w-28 h-28 sm:h-20 object-cover rounded-xl border border-slate-800"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-sm sm:text-base text-white hover:text-blue-400 transition-colors">
                          {complaint.title}
                        </h4>
                        <div className="flex gap-1.5 shrink-0 scale-90 sm:scale-100 origin-right">
                          <Badge type="priority" value={complaint.priority} />
                          <Badge type="status" value={complaint.status} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {complaint.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/40 pt-3 mt-3 text-xxs text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={12} className="text-slate-500" />
                        {complaint.location.address}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={12} className="text-slate-500" />
                        {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card hoverable={false} className="border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <AlertCircle size={36} className="text-slate-700 mb-3 animate-bounce" />
              <h4 className="font-semibold text-sm text-slate-400">No Complaints Registered</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                You haven't reported any infrastructure issues yet. Help improve the city by reporting potholes, broken lights, or leaks.
              </p>
              <Link
                to="/citizen/report"
                className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xxs px-4 py-2 rounded-xl transition-all"
              >
                File an Issue
              </Link>
            </Card>
          )}
        </div>

        {/* Right: Quick Tips / Recent Updates */}
        <div className="flex flex-col gap-6">
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3">
              Helpful Hints
            </h3>
            <ul className="flex flex-col gap-3 mt-4 text-xs text-slate-400 leading-relaxed">
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Upload clear, well-lit photos of the issue to boost AI classification confidence.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Always allow GPS permissions during filing to map coordinates perfectly.
              </li>
              <li className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                Check the History Feed first to avoid logging duplicate issues.
              </li>
            </ul>
          </Card>

          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3">
              Recent Activity
            </h3>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex gap-3 text-xxs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Water Main Leak resolved</p>
                  <p className="text-slate-400 mt-0.5">Officer Robert Chen marked comp-1 resolved.</p>
                  <span className="text-[10px] text-slate-500">12 hours ago</span>
                </div>
              </div>
              <div className="flex gap-3 text-xxs">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10 mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-200">Pothole patched</p>
                  <p className="text-slate-400 mt-0.5">Work started on pothole report comp-2 on Market St.</p>
                  <span className="text-[10px] text-slate-500">1 day ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default CitizenDashboard;
