import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import type { Complaint } from '../types/complaint';
import Badge from './Badge';
import { MapPin, AlertCircle, FileText } from 'lucide-react';

interface MapComponentProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLatLng?: [number, number] | null;
}

// Controller to auto-recenter map when coordinates change
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Click handler component to capture coordinates for complaint creation
const MapClickHandler: React.FC<{ onClick?: (lat: number, lng: number) => void }> = ({ onClick }) => {
  const map = useMap();
  useEffect(() => {
    if (!onClick) return;
    const handler = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [onClick, map]);
  return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  complaints,
  center = [37.7749, -122.4194], // San Francisco center
  zoom = 13,
  interactive = true,
  onMapClick,
  selectedLatLng
}) => {
  const navigate = useNavigate();

  // Create custom colored pins using L.divIcon
  const createCustomIcon = (priority: string, isSelected = false) => {
    let color = '#22c55e'; // Green
    if (priority === 'critical') color = '#e11d48'; // Red
    else if (priority === 'high') color = '#f59e0b'; // Orange
    else if (priority === 'medium') color = '#eab308'; // Yellow

    const pulseClass = isSelected ? 'animate-ping opacity-75' : '';

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          ${isSelected ? `<div class="absolute w-10 h-10 rounded-full bg-blue-500/20 ${pulseClass}"></div>` : ''}
          <div class="absolute w-7 h-7 rounded-full bg-slate-950 dark:bg-slate-900 border-2 flex items-center justify-center shadow-lg" style="border-color: ${color}">
            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></div>
          </div>
          <div class="absolute bottom-0 w-2 h-2 rotate-45 bg-slate-950 dark:bg-slate-900 border-r border-b" style="border-color: ${color}; transform: translateY(5px) rotate(45deg);"></div>
        </div>
      `,
      className: 'custom-leaflet-pin',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  return (
    <div className="w-full h-full relative min-h-[350px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800/40">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="w-full h-full"
      >
        <ChangeView center={center} zoom={zoom} />
        
        {onMapClick && <MapClickHandler onClick={onMapClick} />}

        {/* Use standard OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark:opacity-85 dark:invert dark:hue-rotate-[180deg]" // Standard trick to make OSM match dark themes
        />

        {/* Render Complaint Markers */}
        {complaints.map(complaint => (
          <Marker
            key={complaint.id}
            position={[complaint.location.lat, complaint.location.lng]}
            icon={createCustomIcon(complaint.priority)}
          >
            <Popup className="premium-map-popup">
              <div className="flex flex-col gap-2 w-48 text-slate-100">
                {complaint.imageUrl && (
                  <img
                    src={complaint.imageUrl}
                    alt={complaint.title}
                    className="w-full h-24 object-cover rounded-lg border border-slate-700/50"
                  />
                )}
                <div>
                  <h4 className="font-bold text-sm leading-tight text-white">{complaint.title}</h4>
                  <p className="text-xxs text-slate-400 mt-0.5">{complaint.location.address}</p>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge type="priority" value={complaint.priority} className="scale-75 origin-left" />
                  <Badge type="status" value={complaint.status} className="scale-75 origin-left" />
                </div>

                <div className="flex justify-between items-center text-xxs text-slate-400 border-t border-slate-700/50 pt-1.5 mt-1">
                  <span className="flex items-center gap-0.5">
                    <AlertCircle size={10} className="text-red-400" />
                    {complaint.reportsCount} report{complaint.reportsCount > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                    className="flex items-center gap-0.5 text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <FileText size={10} />
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Selected target marker when reporting a complaint */}
        {selectedLatLng && (
          <Marker
            position={selectedLatLng}
            icon={createCustomIcon('critical', true)} // highlight with critical (Red) pin
          >
            <Popup>
              <div className="text-xs text-slate-900 dark:text-slate-100 p-1">
                <p className="font-semibold flex items-center gap-1">
                  <MapPin size={12} className="text-blue-500" />
                  Target Complaint Spot
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xxs mt-0.5">
                  Lat: {selectedLatLng[0].toFixed(5)}, Lng: {selectedLatLng[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
export default MapComponent;
