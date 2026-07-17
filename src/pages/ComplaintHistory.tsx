import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { complaintService } from '../services/complaintService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import type { ComplaintPriority, ComplaintStatus, ComplaintFilters } from '../types/complaint';
import { Search, SlidersHorizontal, MapPin, Clock, AlertCircle } from 'lucide-react';

export const ComplaintHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority | 'all'>('all');
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all');
  const [category, setCategory] = useState<string>('all');

  // Query filtered data via TanStack Query
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints-feed', { search, priority, status, category, userId: user?.id }],
    queryFn: () => {
      const filters: ComplaintFilters = { search, priority, status, category };
      if (user?.role === 'citizen') {
        filters.reporterId = user.id;
        filters.reporterName = user.name;
      }
      return complaintService.filterComplaints(filters);
    }
  });

  const categories = [
    'Roads & Streets',
    'Traffic & Transportation',
    'Electricity',
    'Water Supply',
    'Sanitation & Waste',
    'Environment',
    'Public Health & Safety',
    'Public Infrastructure',
    'Flooding & Disaster Risks',
    'Public Safety',
    'Public Transport',
    'Public Utilities',
    'Other Public Issues'
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-slate-800/40 pb-2">
        <h2 className="text-xl font-bold text-white">City Issues & History Feed</h2>
        <p className="text-xs text-slate-400">Search and audit community tickets reported across municipal divisions</p>
      </div>

      {/* Filter panel */}
      <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-2.5 text-slate-500 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search keyword, location, ID..."
              className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
            />
          </div>

          {/* Selector filters */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold shrink-0">
              <SlidersHorizontal size={14} />
              Filters:
            </div>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-300 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={priority}
              onChange={e => setPriority(e.target.value as ComplaintPriority | 'all')}
              className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-300 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={status}
              onChange={e => setStatus(e.target.value as ComplaintStatus | 'all')}
              className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xs outline-none text-slate-300 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="ai_verified">AI Verified</option>
              <option value="assigned">Assigned</option>
              <option value="work_started">Work Started</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-900/50 rounded-2xl border border-slate-800/80" />
          ))}
        </div>
      ) : complaints && complaints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complaints.map(complaint => (
            <Card
              key={complaint.id}
              onClick={() => navigate(`/complaints/${complaint.id}`)}
              className="cursor-pointer border-slate-800/60 hover:border-slate-700/60 bg-slate-900/20 p-5 flex flex-col justify-between gap-4 h-full"
            >
              <div>
                <div className="flex items-start gap-4">
                  {complaint.imageUrl && (
                    <img
                      src={complaint.imageUrl}
                      alt={complaint.title}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-800 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1.5 scale-90 origin-left">
                      <Badge type="priority" value={complaint.priority} />
                      <Badge type="status" value={complaint.status} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors truncate">
                      {complaint.title}
                    </h3>
                    <p className="text-xxs text-slate-400 mt-0.5 font-semibold text-blue-400">{complaint.category}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-2 text-xxs text-slate-400">
                <span className="flex items-center gap-1 font-medium truncate max-w-[60%]">
                  <MapPin size={12} className="text-slate-500 shrink-0" />
                  {complaint.location.address}
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-400 shrink-0">
                  <Clock size={12} className="text-slate-500" />
                  {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card hoverable={false} className="border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center p-12 text-center text-slate-500">
          <AlertCircle size={36} className="text-slate-700 mb-3 animate-bounce" />
          <h4 className="font-semibold text-sm text-slate-400">No Matching Complaints</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            No active reports match the selected keywords or parameters. Try updating your filters or search terms.
          </p>
        </Card>
      )}
    </div>
  );
};
export default ComplaintHistory;
