export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'submitted' | 'ai_verified' | 'assigned' | 'work_started' | 'resolved';

export interface LocationCoords {
  lat: number;
  lng: number;
  address: string;
}

export interface TimelineStep {
  status: ComplaintStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  imageUrl?: string;
  location: LocationCoords;
  reporterId: string;
  reporterName: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  reportsCount: number; // For duplicate flagging support
  statusTimeline: TimelineStep[];
  comments: ComplaintComment[];
  aiNotes?: string;
  estimatedResolutionDate?: string;
}

export interface ComplaintFilters {
  priority?: ComplaintPriority | 'all';
  status?: ComplaintStatus | 'all';
  category?: string;
  search?: string;
  assignedOfficerId?: string;
  reporterId?: string;
  reporterName?: string;
}

export interface ComplaintDbRow {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  image_url: string | null;
  lat: number;
  lng: number;
  address: string;
  reporter_id: string | null;
  reporter_name: string;
  assigned_officer_id: string | null;
  assigned_officer_name: string | null;
  created_at: string;
  updated_at: string;
  reports_count: number;
  status_timeline: TimelineStep[] | null;
  ai_notes: string | null;
  estimated_resolution_date: string | null;
}

export interface CommentDbRow {
  id: string;
  complaint_id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}
