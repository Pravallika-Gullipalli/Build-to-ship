import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { complaintService } from '../services/complaintService';
import { geminiService } from '../services/geminiService';
import type { AiAnalysisResult } from '../services/geminiService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'my_active' | 'unassigned' | 'my_resolved'>('my_active');
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Record<string, AiAnalysisResult>>({});

  // Query all complaints to segment queues
  const { data: allComplaints, isLoading, refetch } = useQuery({
    queryKey: ['officer-all-complaints'],
    queryFn: () => complaintService.getAllComplaints()
  });

  useEffect(() => {
    if (!allComplaints || allComplaints.length === 0) return;

    let isSubscribed = true;
    
    const runAnalysis = async () => {
      for (const complaint of allComplaints) {
        if (!isSubscribed) break;
        if (!aiAnalysisCache[complaint.id]) {
          try {
            const analysis = await geminiService.analyzeComplaint(complaint, allComplaints);
            if (isSubscribed) {
              setAiAnalysisCache(prev => ({
                ...prev,
                [complaint.id]: analysis
              }));
            }
          } catch (e) {
            console.error('AI analysis error for', complaint.id, e);
          }
        }
      }
    };

    runAnalysis();

    return () => {
      isSubscribed = false;
    };
  }, [allComplaints]);

  // Self Assign Mutation
  const selfAssignMutation = useMutation({
    mutationFn: (complaintId: string) => 
      complaintService.updateComplaint(complaintId, {
        status: 'assigned',
        assignedOfficerId: user?.id,
        assignedOfficerName: user?.name
      }),
    onSuccess: (updated) => {
      refetch();
      showToast('success', 'Ticket Assigned', `Successfully assigned: ${updated.title}`);
    },
    onError: () => {
      showToast('error', 'Assignment Failed', 'Could not assign ticket.');
    }
  });

  const handleSelfAssign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid navigating to details
    selfAssignMutation.mutate(id);
  };

  const myComplaints = allComplaints?.filter(c => c.assignedOfficerId === user?.id) || [];
  const unassignedQueue = allComplaints?.filter(c => !c.assignedOfficerId && c.status !== 'resolved') || [];

  const activeQueue = myComplaints.filter(c => c.status !== 'resolved');
  const resolvedQueue = myComplaints.filter(c => c.status === 'resolved');

  const totalAssigned = myComplaints.length;
  const criticalCount = activeQueue.filter(c => c.priority === 'critical').length;
  const inProgressCount = activeQueue.filter(c => c.status === 'work_started').length;
  const completedCount = resolvedQueue.length;

  // Determine current active queue to display
  const currentQueue = 
    activeTab === 'my_active' ? activeQueue :
    activeTab === 'unassigned' ? unassignedQueue :
    resolvedQueue;

  // Sort queue by area alphabetically (via address)
  const sortedQueue = [...currentQueue].sort((a, b) => {
    const addrA = a.location?.address || '';
    const addrB = b.location?.address || '';
    return addrA.localeCompare(addrB);
  });

  // Group sortedQueue by Area Name
  interface GroupedArea {
    areaName: string;
    primaryComplaints: any[];
    duplicateComplaints: any[];
  }
  
  const getAreaName = (address: string): string => {
    if (!address) return 'Unassigned Sector';
    const cleaned = address.replace(/^\d+\s+/, '').replace(/^Flat\s+\d+,\s+/i, '').trim();
    const parts = cleaned.split(',').map(p => p.trim());
    if (parts.length > 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    return parts[0] || 'General Sector';
  };

  const groupedAreasMap: Record<string, GroupedArea> = {};
  
  for (const c of sortedQueue) {
    const areaName = getAreaName(c.location?.address);
    if (!groupedAreasMap[areaName]) {
      groupedAreasMap[areaName] = {
        areaName,
        primaryComplaints: [],
        duplicateComplaints: []
      };
    }
    
    const isDuplicate = aiAnalysisCache[c.id]?.isDuplicate;
    if (isDuplicate) {
      groupedAreasMap[areaName].duplicateComplaints.push(c);
    } else {
      groupedAreasMap[areaName].primaryComplaints.push(c);
    }
  }

  const groupedAreas = Object.values(groupedAreasMap);

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

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-850 gap-4">
        <button
          onClick={() => setActiveTab('my_active')}
          className={`pb-2.5 text-xxs font-bold uppercase tracking-wider transition-all relative
            ${activeTab === 'my_active' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          My Active Queue ({activeQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`pb-2.5 text-xxs font-bold uppercase tracking-wider transition-all relative
            ${activeTab === 'unassigned' ? 'text-blue-500 border-b-2 border-blue-500 border-pulse' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Available Tickets ({unassignedQueue.length})
        </button>
        <button
          onClick={() => setActiveTab('my_resolved')}
          className={`pb-2.5 text-xxs font-bold uppercase tracking-wider transition-all relative
            ${activeTab === 'my_resolved' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
        >
          My Resolved Tickets ({resolvedQueue.length})
        </button>
      </div>

      {/* Queue Content */}
      <div className="flex flex-col gap-6">
        
        {/* Assigned Queue list */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
              {activeTab === 'my_active' ? 'My Active Work' : activeTab === 'unassigned' ? 'Unassigned City Tasks' : 'My Completed Records'}
            </h3>
            <span className="text-xxs text-slate-400 font-bold uppercase">
              {sortedQueue.length} Tickets
            </span>
          </div>

          {groupedAreas.length > 0 ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {groupedAreas.map(area => (
                <Card
                  key={area.areaName}
                  hoverable={false}
                  className="border-slate-800/60 bg-slate-900/40 p-6 flex flex-col gap-4"
                >
                  {/* Area Header */}
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <h4 className="font-bold text-sm text-blue-400 flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500 animate-pulse" />
                      {area.areaName}
                    </h4>
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {area.primaryComplaints.length + area.duplicateComplaints.length} Tickets
                    </span>
                  </div>

                  {/* Primary Complaints in Area */}
                  <div className="flex flex-col gap-3">
                    {area.primaryComplaints.map(c => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/complaints/${c.id}`)}
                        className="cursor-pointer border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-950/40 p-4 rounded-xl flex flex-col sm:flex-row gap-4 transition-all duration-200"
                      >
                        {c.imageUrl && (
                          <img
                            src={c.imageUrl}
                            alt={c.title}
                            className="w-full sm:w-20 h-20 object-cover rounded-lg border border-slate-800 shrink-0"
                          />
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <h5 className="font-bold text-xs sm:text-sm text-white hover:text-blue-400 transition-colors">
                                {c.title}
                              </h5>
                              <div className="flex gap-1 shrink-0 scale-90 origin-right">
                                <Badge type="priority" value={c.priority} />
                                <Badge type="status" value={c.status} />
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold text-blue-400 mt-0.5 uppercase tracking-wide">
                              {c.category}
                            </p>
                          </div>

                          {/* AI Insights panel */}
                          {aiAnalysisCache[c.id] ? (
                            <div className="mt-2.5 bg-blue-950/20 border border-blue-500/10 rounded-lg p-2.5 flex flex-col gap-1">
                              <span className="text-[8px] uppercase font-bold tracking-wider text-blue-400">
                                ✨ Gemini AI Insights
                              </span>
                              <p className="text-[10px] text-slate-300">
                                <strong className="text-slate-400">Summary:</strong> {aiAnalysisCache[c.id].summary}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-slate-500 italic">
                              <div className="w-3 h-3 border border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                              <span>Gemini analyzing...</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-slate-800/40 pt-3 mt-3 text-xxs text-slate-400">
                            <span className="flex items-center gap-1 font-semibold truncate max-w-[60%]">
                              <MapPin size={12} className="text-slate-500" />
                              {c.location.address}
                            </span>
                            <div className="flex items-center gap-2">
                              {activeTab === 'unassigned' && (
                                <button
                                  onClick={(e) => handleSelfAssign(e, c.id)}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-glow-blue"
                                >
                                  <UserCheck size={12} />
                                  Accept Work
                                </button>
                              )}
                              <span className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300">
                                Details &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Duplicate Complaints in Area */}
                  {area.duplicateComplaints.length > 0 && (
                    <div className="flex flex-col gap-2.5 border-t border-slate-850 pt-3.5 mt-1">
                      <span className="text-[10px] uppercase font-black text-rose-500/80 tracking-wider flex items-center gap-1.5 animate-pulse">
                        ⚠️ Duplicate Submissions ({area.duplicateComplaints.length})
                      </span>
                      <div className="flex flex-col gap-2 pl-3 border-l-2 border-slate-800">
                        {area.duplicateComplaints.map(c => (
                          <div
                            key={c.id}
                            onClick={() => navigate(`/complaints/${c.id}`)}
                            className="cursor-pointer border border-rose-500/5 hover:border-rose-500/20 bg-rose-950/5 hover:bg-rose-950/15 p-3 rounded-lg flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center transition-all duration-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h6 className="font-semibold text-xxs sm:text-xs text-slate-300">
                                  {c.title}
                                </h6>
                                <span className="text-[8px] uppercase font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                                  Duplicate
                                </span>
                              </div>
                              {aiAnalysisCache[c.id]?.duplicateWarning && (
                                <p className="text-[9px] text-slate-500 mt-0.5 font-medium">
                                  {aiAnalysisCache[c.id].duplicateWarning}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 hover:text-blue-400 font-bold shrink-0">
                              Details &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card hoverable={false} className="border-slate-800 bg-slate-900/10 flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
              <h4 className="font-semibold text-sm text-slate-400">All Clear!</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {activeTab === 'my_active' 
                  ? 'You have no active complaints assigned. Check "Available Tickets" to claim unassigned work!'
                  : activeTab === 'unassigned'
                  ? 'No unassigned tickets are currently open in the city database. Great job!'
                  : 'You have not marked any issues as resolved yet.'}
              </p>
            </Card>
          )}
        </div>

        {/* Duty Guidelines Banner */}
        <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-4 mt-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white border-b border-slate-800/60 pb-2 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-400" />
            Duty Guidelines & Standards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xxs text-slate-400 leading-relaxed font-semibold">
            <p className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
              <AlertTriangle size={14} className="text-rose-500 shrink-0" />
              Critical issues must be investigated within 1 hour.
            </p>
            <p className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              Ensure all resolution works are documented with photographic updates.
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};
export default OfficerDashboard;
