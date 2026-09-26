import type { Complaint } from '../types/complaint';
import { complaintService } from './complaintService';

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

export const mapService = {
  async getNearbyComplaints(lat: number, lng: number, radiusKm = 1.5): Promise<Complaint[]> {
    const complaints = await complaintService.getAllComplaints();
    return complaints
      .filter(c => c.status !== 'resolved')
      .filter(c => calculateDistance(lat, lng, c.location.lat, c.location.lng) <= radiusKm);
  },

  async getComplaintMarkers(): Promise<Complaint[]> {
    const complaints = await complaintService.getAllComplaints();
    return complaints.filter(c => c.status !== 'resolved');
  },

  async getHeatmapData(): Promise<{ lat: number; lng: number; intensity: number }[]> {
    const complaints = await complaintService.getAllComplaints();
    const active = complaints.filter(c => c.status !== 'resolved');

    const intensityMap = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.2
    };

    return active.map(c => ({
      lat: c.location.lat,
      lng: c.location.lng,
      intensity: intensityMap[c.priority as keyof typeof intensityMap] || 0.5
    }));
  },

  getStaticMapUrl(lat: number, lng: number, zoom = 15, width = 600, height = 300): string {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
    }
    // Fallback static map imagery using OpenStreetMap static tiles
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lng},ol-marker`;
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
        const json = await response.json();
        if (json.status === 'OK' && json.results && json.results.length > 0) {
          return json.results[0].formatted_address;
        }
      } catch (e) {
        console.warn('Google Maps reverse geocoding failed, trying Nominatim:', e);
      }
    }
    
    // Keyless fallback using OpenStreetMap Nominatim API
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'CivicFixApp/1.0'
        }
      });
      const json = await response.json();
      if (json && json.display_name) {
        return json.display_name;
      }
    } catch (e) {
      console.warn('Nominatim reverse geocoding failed, using coordinates format:', e);
    }

    // Secondary BigDataCloud free client-side reverse geocoder fallback
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const json = await response.json();
      if (json && (json.locality || json.city || json.principalSubdivision)) {
        const parts = [json.locality || json.city, json.principalSubdivision, json.countryName].filter(Boolean);
        return parts.join(', ');
      }
    } catch {
      // ignore
    }

    return `Around ${lat.toFixed(4)} N, ${lng.toFixed(4)} W`;
  }
};
export default mapService;
