import type { Complaint } from '../types/complaint';
import { supabase } from '../lib/supabaseClient';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const mapRowToComplaint = (row: any): Complaint => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  priority: row.priority,
  status: row.status,
  imageUrl: row.image_url || undefined,
  location: {
    lat: row.lat,
    lng: row.lng,
    address: row.address
  },
  reporterId: row.reporter_id,
  reporterName: row.reporter_name,
  assignedOfficerId: row.assigned_officer_id || undefined,
  assignedOfficerName: row.assigned_officer_name || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  reportsCount: row.reports_count,
  statusTimeline: row.status_timeline || [],
  comments: []
});

export const mapService = {
  async getNearbyComplaints(lat: number, lng: number, radiusKm = 1.5): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .neq('status', 'resolved');

    if (error) throw error;

    return (data || [])
      .map(mapRowToComplaint)
      .filter(c => calculateDistance(lat, lng, c.location.lat, c.location.lng) <= radiusKm);
  },

  async getComplaintMarkers(): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .neq('status', 'resolved');

    if (error) throw error;
    return (data || []).map(mapRowToComplaint);
  },

  async getHeatmapData(): Promise<{ lat: number; lng: number; intensity: number }[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('lat, lng, priority')
      .neq('status', 'resolved');

    if (error) throw error;

    const intensityMap = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.2
    };

    return (data || []).map(row => ({
      lat: row.lat,
      lng: row.lng,
      intensity: intensityMap[row.priority as keyof typeof intensityMap] || 0.5
    }));
  }
};
export default mapService;
