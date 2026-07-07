import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { complaintService } from '../services/complaintService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Timeline from '../components/Timeline';
import MapComponent from '../components/MapComponent';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Cpu, 
  User, 
  Send, 
  Play, 
  CheckCircle,
  UserCheck
} from 'lucide-react';
import type { ComplaintStatus } from '../types/complaint';

export const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isOfficer, isAdmin } = useAuth();
  const { showToast } = useNotification();
  const queryClient = useQueryClient();
  const [commentInput, setCommentInput] = useState('');

  // Fetch complaint details
  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ['complaint-details', id],
    queryFn: () => complaintService.getComplaint(id || ''),
    enabled: !!id
  });

  // Mutation for adding a comment
  const addCommentMutation = useMutation({
    mutationFn: (text: string) => 
      complaintService.addComment(
        complaint!.id, 
        user!.id, 
        user!.name, 
        user!.role, 
        text
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint-details', id] });
      setCommentInput('');
      showToast('success', 'Comment Added', 'Your update has been appended to the log.');
    }
  });

  // Mutation for updating complaint status (For Officers/Admins)
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: ComplaintStatus) => {
      const updates: any = { status: newStatus };
      // If assigning to active officer
      if (newStatus === 'assigned' && !complaint?.assignedOfficerId) {
        updates.assignedOfficerId = user?.id;
        updates.assignedOfficerName = user?.name;
      }
      return complaintService.updateComplaint(complaint!.id, updates);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['complaint-details', id] });
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints-feed'] });
      showToast('success', 'Status Updated', `Ticket is now marked as ${updated.status.toUpperCase()}`);
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addCommentMutation.mutate(commentInput);
  };

  const handleStatusTransition = (status: ComplaintStatus) => {
    updateStatusMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-xl w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900 rounded-2xl" />
          <div className="h-96 bg-slate-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <Card hoverable={false} className="border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <h4 className="font-semibold text-sm text-slate-400">Complaint Not Found</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          The requested complaint ID does not exist or has been removed from municipal tracking records.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-slate-800 text-slate-300 font-bold text-xxs px-4 py-2 rounded-xl"
        >
          Go Back
        </button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to list
        </button>

        {/* Officer administrative actions */}
        {(isOfficer || isAdmin) && (
          <div className="flex items-center gap-2">
            {complaint.status === 'submitted' && (
              <button
                onClick={() => handleStatusTransition('assigned')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xxs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-glow-blue"
              >
                <UserCheck size={14} />
                Accept & Self-Assign
              </button>
            )}
            {complaint.status === 'assigned' && (
              <button
                onClick={() => handleStatusTransition('work_started')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xxs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Play size={14} />
                Start Repair Work
              </button>
            )}
            {complaint.status === 'work_started' && (
              <button
                onClick={() => handleStatusTransition('resolved')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <CheckCircle size={14} />
                Mark Resolved
              </button>
            )}
            <span className="text-xxs text-slate-500 font-semibold px-2 uppercase border border-slate-800/80 rounded bg-slate-900/40">
              Agent Tools
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Info card, AI, Map, Comments */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main Info Card */}
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 items-center scale-90 sm:scale-100 origin-left">
              <Badge type="priority" value={complaint.priority} />
              <Badge type="status" value={complaint.status} />
              <span className="text-xxs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-bold uppercase">
                {complaint.category}
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
                {complaint.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-slate-500" />
                  {complaint.location.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-500" />
                  Reported by {complaint.reporterName} on {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </p>
            </div>

            {complaint.imageUrl && (
              <div className="rounded-xl border border-slate-800 overflow-hidden h-64 bg-slate-950">
                <img
                  src={complaint.imageUrl}
                  alt={complaint.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="border-t border-slate-800/50 pt-4">
              <h4 className="font-bold text-xs uppercase text-slate-300 tracking-wider">Detailed Description</h4>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {complaint.assignedOfficerName && (
              <div className="border-t border-slate-800/50 pt-4 flex items-center gap-2.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-slate-400">Assigned Dispatch Officer</p>
                  <p className="font-bold text-white">{complaint.assignedOfficerName}</p>
                </div>
              </div>
            )}
          </Card>

          {/* AI Notes panel */}
          {complaint.aiNotes && (
            <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5 flex flex-col gap-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
                <Cpu size={14} className="text-violet-400" />
                AI Dispatch Log Notes
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {complaint.aiNotes}
              </p>
            </Card>
          )}

          {/* Comments / Activity Stream */}
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col gap-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-blue-500" />
              Department Updates & Comments ({complaint.comments.length})
            </h3>

            {/* Comments list */}
            <div className="flex flex-col gap-4 mt-2">
              {complaint.comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 text-xs border-b border-slate-800/30 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        {c.userName}
                        <span className="text-[10px] text-slate-500 uppercase font-semibold ml-2 px-1 border border-slate-800 rounded bg-slate-900/40">
                          {c.userRole}
                        </span>
                      </span>
                      <span className="text-xxs text-slate-400 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Post comment form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-3 mt-2">
              <input
                type="text"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="Write an update, question, or note..."
                className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 text-slate-200 transition-colors"
              />
              <button
                type="submit"
                disabled={addCommentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </Card>
        </div>

        {/* Right column: Timeline & Mini map location */}
        <div className="flex flex-col gap-6">
          
          {/* Status Timeline */}
          <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-3 mb-4">
              Ticket Tracking Timeline
            </h3>
            <Timeline steps={complaint.statusTimeline} />
          </Card>

          {/* Location coordinates focus map */}
          <div className="h-64">
            <MapComponent
              complaints={[complaint]}
              center={[complaint.location.lat, complaint.location.lng]}
              zoom={14}
              interactive={true}
            />
          </div>
        </div>

      </div>
    </div>
  );
};
export default ComplaintDetails;
