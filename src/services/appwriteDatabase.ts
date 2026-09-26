import { databases, ID, Query } from '../lib/appwrite';
import type { Complaint, ComplaintComment } from '../types/complaint';
import type { User } from '../types/user';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const COMPLAINTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMPLAINTS_COLLECTION_ID || '';
const PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || '';
const COMMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID || '';

export const appwriteDatabase = {
  isConfigured(): boolean {
    return Boolean(DATABASE_ID && COMPLAINTS_COLLECTION_ID);
  },

  async listComplaints(limit = 100): Promise<Complaint[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLAINTS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(limit)]
      );

      return response.documents.map((doc: any) => ({
        id: doc.$id,
        title: doc.title || '',
        description: doc.description || '',
        category: doc.category || 'General',
        priority: doc.priority || 'medium',
        status: doc.status || 'submitted',
        imageUrl: doc.imageUrl || doc.image_url || undefined,
        location: {
          lat: Number(doc.lat) || 0,
          lng: Number(doc.lng) || 0,
          address: doc.address || ''
        },
        reporterId: doc.reporterId || doc.reporter_id || '',
        reporterName: doc.reporterName || doc.reporter_name || 'Citizen',
        assignedOfficerId: doc.assignedOfficerId || doc.assigned_officer_id || undefined,
        assignedOfficerName: doc.assignedOfficerName || doc.assigned_officer_name || undefined,
        createdAt: doc.$createdAt || doc.createdAt,
        updatedAt: doc.$updatedAt || doc.updatedAt,
        reportsCount: doc.reportsCount || doc.reports_count || 1,
        statusTimeline: doc.statusTimeline ? (typeof doc.statusTimeline === 'string' ? JSON.parse(doc.statusTimeline) : doc.statusTimeline) : [],
        comments: [],
        aiNotes: doc.aiNotes || doc.ai_notes || undefined,
        estimatedResolutionDate: doc.estimatedResolutionDate || doc.estimated_resolution_date || undefined
      }));
    } catch (err) {
      console.warn('[Appwrite Database] listComplaints notice:', err);
      return null;
    }
  },

  async createComplaint(data: any): Promise<any | null> {
    if (!this.isConfigured()) return null;

    // Clean payload matching created Appwrite attributes
    const cleanPayload: Record<string, any> = {
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'General',
      priority: data.priority || 'medium',
      status: data.status || 'submitted',
      imageUrl: data.imageUrl || data.image_url || null,
      lat: typeof data.location?.lat === 'number' ? data.location.lat : null,
      lng: typeof data.location?.lng === 'number' ? data.location.lng : null,
      address: data.location?.address || data.address || '',
      reporterId: data.reporterId || data.reporter_id || '',
      reporterName: data.reporterName || data.reporter_name || 'Citizen',
      reportsCount: data.reportsCount || data.reports_count || 1
    };

    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        COMPLAINTS_COLLECTION_ID,
        ID.unique(),
        cleanPayload
      );
      console.log('[Appwrite Database] Complaint saved successfully to Appwrite:', doc.$id);
      return doc;
    } catch (err: any) {
      console.warn('[Appwrite Database] createComplaint notice:', err?.message || err);
      return null;
    }
  },

  async updateComplaint(complaintId: string, updates: Partial<Complaint>): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      const payload: Record<string, any> = {};
      if (updates.status) payload.status = updates.status;
      if (updates.assignedOfficerId) payload.assignedOfficerId = updates.assignedOfficerId;
      if (updates.assignedOfficerName) payload.assignedOfficerName = updates.assignedOfficerName;

      return await databases.updateDocument(
        DATABASE_ID,
        COMPLAINTS_COLLECTION_ID,
        complaintId,
        payload
      );
    } catch (err: any) {
      console.warn('[Appwrite Database] updateComplaint notice:', err?.message || err);
      return null;
    }
  },

  async getComplaint(id: string): Promise<Complaint | null> {
    if (!this.isConfigured()) return null;
    try {
      const doc: any = await databases.getDocument(
        DATABASE_ID,
        COMPLAINTS_COLLECTION_ID,
        id
      );

      return {
        id: doc.$id,
        title: doc.title || '',
        description: doc.description || '',
        category: doc.category || 'General',
        priority: doc.priority || 'medium',
        status: doc.status || 'submitted',
        imageUrl: doc.imageUrl || doc.image_url || undefined,
        location: {
          lat: Number(doc.lat) || 0,
          lng: Number(doc.lng) || 0,
          address: doc.address || ''
        },
        reporterId: doc.reporterId || doc.reporter_id || '',
        reporterName: doc.reporterName || doc.reporter_name || 'Citizen',
        assignedOfficerId: doc.assignedOfficerId || doc.assigned_officer_id || undefined,
        assignedOfficerName: doc.assignedOfficerName || doc.assigned_officer_name || undefined,
        createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
        updatedAt: doc.$updatedAt || doc.updatedAt || new Date().toISOString(),
        reportsCount: doc.reportsCount || doc.reports_count || 1,
        statusTimeline: doc.statusTimeline ? (typeof doc.statusTimeline === 'string' ? JSON.parse(doc.statusTimeline) : doc.statusTimeline) : [],
        comments: [],
        aiNotes: doc.aiNotes || doc.ai_notes || undefined,
        estimatedResolutionDate: doc.estimatedResolutionDate || doc.estimated_resolution_date || undefined
      };
    } catch (err) {
      console.warn('[Appwrite Database] getComplaint notice:', err);
      return null;
    }
  },

  async deleteComplaint(complaintId: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COMPLAINTS_COLLECTION_ID,
        complaintId
      );
      return true;
    } catch (err: any) {
      console.warn('[Appwrite Database] deleteComplaint notice:', err?.message || err);
      return false;
    }
  },

  async listComments(complaintId: string): Promise<ComplaintComment[]> {
    if (!DATABASE_ID || !COMMENTS_COLLECTION_ID) return [];
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [Query.equal('complaintId', complaintId), Query.orderAsc('$createdAt')]
      );
      return res.documents.map((d: any) => ({
        id: d.$id,
        complaintId: d.complaintId,
        userId: d.userId || '',
        userName: d.userName || 'User',
        userRole: d.userRole || 'citizen',
        content: d.content || '',
        createdAt: d.$createdAt || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  },

  async syncProfile(user: User): Promise<any | null> {
    if (!DATABASE_ID || !PROFILES_COLLECTION_ID) return null;
    try {
      const profilePayload = {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        department: user.department || '',
        assignedRegion: user.assignedRegion || '',
        avatarUrl: user.avatarUrl || ''
      };

      // Check if profile exists
      try {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          PROFILES_COLLECTION_ID,
          [Query.equal('userId', user.id)]
        );

        if (existing.documents.length > 0) {
          const docId = existing.documents[0].$id;
          return await databases.updateDocument(
            DATABASE_ID,
            PROFILES_COLLECTION_ID,
            docId,
            profilePayload
          );
        }
      } catch {}

      // Create new profile doc
      return await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        profilePayload
      );
    } catch (err: any) {
      console.warn('[Appwrite Database] syncProfile notice:', err?.message || err);
      return null;
    }
  },

  async getProfile(userId: string): Promise<any | null> {
    if (!DATABASE_ID || !PROFILES_COLLECTION_ID) return null;
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId), Query.limit(1)]
      );
      return res.documents[0] || null;
    } catch {
      return null;
    }
  },

  async getProfileByEmail(email: string): Promise<any | null> {
    if (!DATABASE_ID || !PROFILES_COLLECTION_ID) return null;
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        [Query.equal('email', email.trim().toLowerCase()), Query.limit(1)]
      );
      return res.documents[0] || null;
    } catch {
      return null;
    }
  },

  async createComment(complaintId: string, comment: Omit<ComplaintComment, 'id' | 'createdAt'>): Promise<any | null> {
    if (!DATABASE_ID || !COMMENTS_COLLECTION_ID) return null;
    try {
      return await databases.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        ID.unique(),
        {
          complaintId,
          userId: comment.userId,
          userName: comment.userName,
          userRole: comment.userRole,
          content: comment.content
        }
      );
    } catch (err: any) {
      console.warn('[Appwrite Database] createComment notice:', err?.message || err);
      return null;
    }
  }
};

export default appwriteDatabase;
