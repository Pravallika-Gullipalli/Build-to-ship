import type { Complaint, ComplaintFilters, ComplaintComment, ComplaintStatus, TimelineStep } from '../types/complaint';
import { supabase } from '../lib/supabaseClient';

const isValidUuid = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const mapComplaint = (dbRow: any, comments: ComplaintComment[] = []): Complaint => ({
  id: dbRow.id,
  title: dbRow.title,
  description: dbRow.description,
  category: dbRow.category,
  priority: dbRow.priority,
  status: dbRow.status,
  imageUrl: dbRow.image_url || undefined,
  location: {
    lat: dbRow.lat,
    lng: dbRow.lng,
    address: dbRow.address
  },
  reporterId: dbRow.reporter_id,
  reporterName: dbRow.reporter_name,
  assignedOfficerId: dbRow.assigned_officer_id || undefined,
  assignedOfficerName: dbRow.assigned_officer_name || undefined,
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at,
  reportsCount: dbRow.reports_count,
  statusTimeline: (dbRow.status_timeline as TimelineStep[]) || [],
  comments,
  aiNotes: dbRow.ai_notes || undefined,
  estimatedResolutionDate: dbRow.estimated_resolution_date || undefined
});

const mapComment = (dbRow: any): ComplaintComment => ({
  id: dbRow.id,
  complaintId: dbRow.complaint_id,
  userId: dbRow.user_id,
  userName: dbRow.user_name,
  userRole: dbRow.user_role,
  content: dbRow.content,
  createdAt: dbRow.created_at
});

export const complaintService = {
  async getAllComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => mapComplaint(row));
  },

  async getComplaint(id: string): Promise<Complaint | null> {
    const { data: complaint, error: compError } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (compError) throw compError;
    if (!complaint) return null;

    // Fetch comments
    const { data: comments, error: commError } = await supabase
      .from('comments')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true });

    if (commError) throw commError;

    return mapComplaint(complaint, (comments || []).map(mapComment));
  },

  async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'statusTimeline'>): Promise<Complaint> {
    const nowStr = new Date().toISOString();
    const statusTimeline: TimelineStep[] = [
      { status: 'submitted', title: 'Complaint Filed', description: `Complaint submitted by ${complaintData.reporterName}`, timestamp: nowStr, completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: `AI classified under ${complaintData.category} with priority ${complaintData.priority.toUpperCase()}`, timestamp: new Date(Date.now() + 2000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Awaiting officer assignment', timestamp: '', completed: false },
      { status: 'work_started', title: 'Repair In Progress', description: 'Work crew scheduled/dispatched', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Issue resolved by city services', timestamp: '', completed: false }
    ];

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        priority: complaintData.priority,
        status: 'submitted',
        image_url: complaintData.imageUrl || null,
        lat: complaintData.location.lat,
        lng: complaintData.location.lng,
        address: complaintData.location.address,
        reporter_id: isValidUuid(complaintData.reporterId) ? complaintData.reporterId : null,
        reporter_name: complaintData.reporterName,
        reports_count: complaintData.reportsCount || 1,
        ai_notes: complaintData.aiNotes || null,
        estimated_resolution_date: complaintData.estimatedResolutionDate || null,
        status_timeline: statusTimeline
      })
      .select()
      .single();

    if (error) throw error;
    return mapComplaint(data);
  },

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    // 1. Fetch current ticket to process timeline changes if status updates
    const current = await this.getComplaint(id);
    if (!current) throw new Error('Complaint not found');

    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.reportsCount !== undefined) dbUpdates.reports_count = updates.reportsCount;
    if (updates.assignedOfficerId !== undefined) dbUpdates.assigned_officer_id = updates.assignedOfficerId;
    if (updates.assignedOfficerName !== undefined) dbUpdates.assigned_officer_name = updates.assignedOfficerName;
    if (updates.aiNotes !== undefined) dbUpdates.ai_notes = updates.aiNotes;
    if (updates.estimatedResolutionDate !== undefined) dbUpdates.estimated_resolution_date = updates.estimatedResolutionDate;

    // Timeline calculation
    if (updates.status && updates.status !== current.status) {
      const nowStr = new Date().toISOString();
      const targetStatus = updates.status;
      
      const newTimeline = current.statusTimeline.map(step => {
        if (step.status === targetStatus) {
          return { ...step, completed: true, timestamp: nowStr };
        }
        // Mark all prior steps as completed as well
        const order: ComplaintStatus[] = ['submitted', 'ai_verified', 'assigned', 'work_started', 'resolved'];
        const targetIdx = order.indexOf(targetStatus);
        const stepIdx = order.indexOf(step.status);
        
        if (stepIdx <= targetIdx) {
          return { ...step, completed: true, timestamp: step.timestamp || nowStr };
        }
        return step;
      });

      dbUpdates.status_timeline = newTimeline;
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('complaints')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapComplaint(data);
  },

  async deleteComplaint(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async addComment(complaintId: string, userId: string, userName: string, userRole: string, content: string): Promise<ComplaintComment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        complaint_id: complaintId,
        user_id: isValidUuid(userId) ? userId : null,
        user_name: userName,
        user_role: userRole,
        content: content
      })
      .select()
      .single();

    if (error) throw error;
    return mapComment(data);
  },

  async searchComplaints(query: string): Promise<Complaint[]> {
    const term = `%${query.toLowerCase()}%`;
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .or(`title.ilike.${term},description.ilike.${term},category.ilike.${term},address.ilike.${term}`);

    if (error) throw error;
    return (data || []).map(row => mapComplaint(row));
  },

  async filterComplaints(filters: ComplaintFilters): Promise<Complaint[]> {
    let query = supabase.from('complaints').select('*');

    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.assignedOfficerId) {
      query = query.eq('assigned_officer_id', filters.assignedOfficerId);
    }
    if (filters.reporterId) {
      query = query.eq('reporter_id', filters.reporterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []).map(row => mapComplaint(row));

    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term) ||
        c.location.address.toLowerCase().includes(term) ||
        (c.assignedOfficerName && c.assignedOfficerName.toLowerCase().includes(term))
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
