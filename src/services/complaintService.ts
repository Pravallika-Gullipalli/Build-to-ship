import type { Complaint, ComplaintFilters, ComplaintComment, ComplaintStatus, TimelineStep } from '../types/complaint';
import { appwriteDatabase } from './appwriteDatabase';

const STORAGE_KEY = 'civicfix_complaints_store';
const COMMENTS_KEY = 'civicfix_comments_store';

const initialSampleComplaints: Complaint[] = [
  {
    id: 'comp-101',
    title: 'Severe Pothole Cluster on Ring Road',
    description: 'Multiple deep potholes spanning 50 meters near the South Gate junction causing traffic congestion and vehicle tire damage.',
    category: 'Roads & Streets',
    priority: 'high',
    status: 'work_started',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    location: {
      lat: 16.4793,
      lng: 80.6619,
      address: 'Ring Road, Near South Gate Junction'
    },
    reporterId: 'user-demo-1',
    reporterName: 'John Citizen',
    assignedOfficerId: 'off-1',
    assignedOfficerName: 'Officer Sarah Mitchell',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    reportsCount: 4,
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Filed by John Citizen', timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'Severity classified as HIGH (Roads & Streets)', timestamp: new Date(Date.now() - 3600 * 1000 * 47).toISOString(), completed: true },
      { status: 'assigned', title: 'Assigned to Officer', description: 'Assigned to Officer Sarah Mitchell', timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), completed: true },
      { status: 'work_started', title: 'Repair Underway', description: 'Asphalt crew dispatched', timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(), completed: true },
      { status: 'resolved', title: 'Resolved', description: 'Pending road surface completion', timestamp: '', completed: false }
    ],
    comments: [
      {
        id: 'comm-1',
        complaintId: 'comp-101',
        userId: 'off-1',
        userName: 'Officer Sarah Mitchell',
        userRole: 'officer',
        content: 'Repair team has started work this morning. Expecting completion within 24 hours.',
        createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString()
      }
    ]
  },
  {
    id: 'comp-102',
    title: 'Street Light Failure at Civic Square',
    description: 'Series of 4 street lights are unlit at night creating safety concerns for pedestrians.',
    category: 'Electricity',
    priority: 'medium',
    status: 'assigned',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80',
    location: {
      lat: 16.4820,
      lng: 80.6650,
      address: 'Civic Square, 2nd Cross'
    },
    reporterId: 'user-demo-2',
    reporterName: 'Emily Clark',
    assignedOfficerId: 'off-1',
    assignedOfficerName: 'Officer Sarah Mitchell',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    reportsCount: 2,
    statusTimeline: [
      { status: 'submitted', title: 'Complaint Filed', description: 'Filed by Emily Clark', timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), completed: true },
      { status: 'ai_verified', title: 'AI Verification', description: 'Severity classified as MEDIUM (Electricity)', timestamp: new Date(Date.now() - 3600 * 1000 * 23).toISOString(), completed: true },
      { status: 'assigned', title: 'Assigned to Officer', description: 'Assigned to Electrical Department', timestamp: new Date(Date.now() - 3600 * 1000 * 6).toISOString(), completed: true },
      { status: 'work_started', title: 'Repair Underway', description: 'Inspection scheduled', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Pending inspection', timestamp: '', completed: false }
    ],
    comments: []
  }
];

const getStoredComplaints = (): Complaint[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local complaints storage:', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleComplaints));
  return initialSampleComplaints;
};

const saveStoredComplaints = (complaints: Complaint[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.warn('Failed to write local complaints storage:', e);
  }
};

const getStoredComments = (complaintId: string): ComplaintComment[] => {
  try {
    const raw = localStorage.getItem(`${COMMENTS_KEY}_${complaintId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local comments storage:', e);
  }
  return [];
};

const saveStoredComments = (complaintId: string, comments: ComplaintComment[]): void => {
  try {
    localStorage.setItem(`${COMMENTS_KEY}_${complaintId}`, JSON.stringify(comments));
  } catch (e) {
    console.warn('Failed to save local comments:', e);
  }
};

export const complaintService = {
  async getAllComplaints(): Promise<Complaint[]> {
    if (appwriteDatabase.isConfigured()) {
      try {
        const appwriteList = await appwriteDatabase.listComplaints(100);
        if (appwriteList && appwriteList.length > 0) {
          const localList = getStoredComplaints();
          const mergedMap = new Map<string, Complaint>();
          appwriteList.forEach(c => mergedMap.set(c.id, c));
          localList.forEach(c => {
            if (!mergedMap.has(c.id)) {
              mergedMap.set(c.id, c);
            }
          });
          const result = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          saveStoredComplaints(result);
          return result;
        }
      } catch (err) {
        console.warn('[Appwrite DB] fetch error, using local complaints fallback:', err);
      }
    }

    return getStoredComplaints();
  },

  async getComplaint(id: string): Promise<Complaint | null> {
    if (appwriteDatabase.isConfigured()) {
      try {
        const doc = await appwriteDatabase.getComplaint(id);
        if (doc) {
          const comments = await this.getComments(id);
          doc.comments = comments;
          return doc;
        }
      } catch {}
    }

    const local = getStoredComplaints().find(c => c.id === id);
    if (local) {
      local.comments = getStoredComments(id);
      return local;
    }
    return null;
  },

  async getComments(complaintId: string): Promise<ComplaintComment[]> {
    if (appwriteDatabase.isConfigured()) {
      try {
        const remote = await appwriteDatabase.listComments(complaintId);
        if (remote && remote.length > 0) {
          return remote;
        }
      } catch {}
    }
    return getStoredComments(complaintId);
  },

  async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'statusTimeline'>): Promise<Complaint> {
    const nowStr = new Date().toISOString();
    const generatedId = `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const statusTimeline: TimelineStep[] = [
      { status: 'submitted', title: 'Complaint Filed', description: `Complaint submitted by ${complaintData.reporterName || 'Citizen'}`, timestamp: nowStr, completed: true },
      { status: 'ai_verified', title: 'Verification', description: `Classified under ${complaintData.category} with priority ${complaintData.priority.toUpperCase()}`, timestamp: new Date(Date.now() + 1000).toISOString(), completed: true },
      { status: 'assigned', title: 'Officer Assigned', description: 'Awaiting officer assignment', timestamp: '', completed: false },
      { status: 'work_started', title: 'Repair In Progress', description: 'Work crew scheduled', timestamp: '', completed: false },
      { status: 'resolved', title: 'Resolved', description: 'Issue resolved by city services', timestamp: '', completed: false }
    ];

    let newComplaint: Complaint = {
      id: generatedId,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      priority: complaintData.priority,
      status: 'submitted',
      imageUrl: complaintData.imageUrl,
      location: complaintData.location,
      reporterId: complaintData.reporterId || '',
      reporterName: complaintData.reporterName || 'Citizen',
      reportsCount: complaintData.reportsCount || 1,
      createdAt: nowStr,
      updatedAt: nowStr,
      statusTimeline,
      comments: [],
      aiNotes: complaintData.aiNotes,
      estimatedResolutionDate: complaintData.estimatedResolutionDate
    };

    // 1. Save to Appwrite Database if configured
    if (appwriteDatabase.isConfigured()) {
      try {
        const appwriteDoc = await appwriteDatabase.createComplaint({
          title: newComplaint.title,
          description: newComplaint.description,
          category: newComplaint.category,
          priority: newComplaint.priority,
          status: newComplaint.status,
          imageUrl: newComplaint.imageUrl,
          location: newComplaint.location,
          reporterId: newComplaint.reporterId,
          reporterName: newComplaint.reporterName,
          reportsCount: newComplaint.reportsCount
        });

        if (appwriteDoc?.$id) {
          newComplaint.id = appwriteDoc.$id;
          newComplaint.createdAt = appwriteDoc.$createdAt || nowStr;
        }
      } catch (err) {
        console.warn('[Appwrite DB] Failed to save directly, saved locally:', err);
      }
    }

    // 2. Persist locally
    const currentList = getStoredComplaints();
    const updatedList = [newComplaint, ...currentList.filter(c => c.id !== newComplaint.id)];
    saveStoredComplaints(updatedList);

    return newComplaint;
  },

  async updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint> {
    const current = await this.getComplaint(id);
    if (!current) throw new Error('Complaint not found');

    const nowStr = new Date().toISOString();
    let updatedTimeline = current.statusTimeline;

    if (updates.status && updates.status !== current.status) {
      const targetStatus = updates.status;
      const order: ComplaintStatus[] = ['submitted', 'ai_verified', 'assigned', 'work_started', 'resolved'];
      const targetIdx = order.indexOf(targetStatus);

      updatedTimeline = current.statusTimeline.map(step => {
        const stepIdx = order.indexOf(step.status);
        if (step.status === targetStatus) {
          return { ...step, completed: true, timestamp: nowStr };
        }
        if (stepIdx <= targetIdx) {
          return { ...step, completed: true, timestamp: step.timestamp || nowStr };
        }
        return step;
      });
    }

    const updatedComplaint: Complaint = {
      ...current,
      ...updates,
      updatedAt: nowStr,
      statusTimeline: updatedTimeline
    };

    if (appwriteDatabase.isConfigured()) {
      appwriteDatabase.updateComplaint(id, updates).catch(e => {
        console.warn('[Appwrite Database] update notice:', e);
      });
    }

    const currentList = getStoredComplaints();
    const newList = currentList.map(c => (c.id === id ? updatedComplaint : c));
    saveStoredComplaints(newList);

    return updatedComplaint;
  },

  async deleteComplaint(id: string): Promise<boolean> {
    if (appwriteDatabase.isConfigured()) {
      appwriteDatabase.deleteComplaint(id).catch(() => {});
    }

    const currentList = getStoredComplaints();
    saveStoredComplaints(currentList.filter(c => c.id !== id));
    return true;
  },

  async addComment(complaintId: string, userId: string, userName: string, userRole: string, content: string): Promise<ComplaintComment> {
    const nowStr = new Date().toISOString();
    const newComment: ComplaintComment = {
      id: `comm-${Date.now()}`,
      complaintId,
      userId,
      userName,
      userRole: userRole as any,
      content,
      createdAt: nowStr
    };

    if (appwriteDatabase.isConfigured()) {
      appwriteDatabase.createComment(complaintId, newComment).catch(e => {
        console.warn('[Appwrite Database] comment sync notice:', e);
      });
    }

    const existing = getStoredComments(complaintId);
    saveStoredComments(complaintId, [...existing, newComment]);

    return newComment;
  },

  async searchComplaints(query: string): Promise<Complaint[]> {
    const all = await this.getAllComplaints();
    const term = query.toLowerCase().trim();
    if (!term) return all;

    return all.filter(c =>
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.location.address.toLowerCase().includes(term) ||
      (c.assignedOfficerName && c.assignedOfficerName.toLowerCase().includes(term))
    );
  },

  async filterComplaints(filters: ComplaintFilters): Promise<Complaint[]> {
    const all = await this.getAllComplaints();

    return all.filter(c => {
      if (filters.priority && filters.priority !== 'all' && c.priority !== filters.priority) return false;
      if (filters.status && filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.category && filters.category !== 'all' && c.category !== filters.category) return false;
      if (filters.assignedOfficerId && c.assignedOfficerId !== filters.assignedOfficerId) return false;
      if (filters.reporterId && c.reporterId !== filters.reporterId) {
        if (filters.reporterName && c.reporterName !== filters.reporterName) return false;
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches =
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term) ||
          c.location.address.toLowerCase().includes(term) ||
          (c.assignedOfficerName && c.assignedOfficerName.toLowerCase().includes(term));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
