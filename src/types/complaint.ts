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
}
