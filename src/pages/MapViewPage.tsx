import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { complaintService } from '../services/complaintService';
import { mapService } from '../services/mapService';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Flame } from 'lucide-react';
import type { ComplaintPriority } from '../types/complaint';

export const MapViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Query markers from map service
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['map-markers', priorityFilter],
    queryFn: async () => {
      const all = await complaintService.getAllComplaints();
      const active = all.filter(c => c.status !== 'resolved');
      if (priorityFilter === 'all') return active;
      return active.filter(c => c.priority === priorityFilter);
    }
  });

  // Query heatmaps data
  const { data: heatmapData } = useQuery({
    queryKey: ['map-heatmap'],
    queryFn: () => mapService.getHeatmapData(),
    enabled: showHeatmap
  });

  // Custom marker pin creator
  const createCustomIcon = (priority: string) => {
    let color = '#22c55e'; // Green
    if (priority === 'critical') color = '#e11d48'; // Red
    else if (priority === 'high') color = '#f59e0b'; // Orange
    else if (priority === 'medium') color = '#eab308'; // Yellow

    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 animate-fadeIn">
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

  const getHeatmapColor = (intensity: number) => {
    if (intensity >= 0.9) return '#e11d48'; // Critical
    if (intensity >= 0.6) return '#f59e0b'; // High
    return '#eab308'; // Medium
  };

  const mapCenter: [number, number] = complaints && complaints.length > 0
    ? [complaints[0].location.lat, complaints[0].location.lng]
    : [16.4793, 80.6619];

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">

      {/* Top Filter Bar */}
      <Card hoverable={false} className="border-slate-800/60 bg-slate-900/40 p-4 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={16} className="text-blue-500" />
              Civic Operations Live Map
            </h2>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Real-time GPS dispatch coordinates</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowHeatmap(prev => !prev)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl border text-xxs font-bold uppercase transition-all duration-200
                ${showHeatmap
                  ? 'bg-rose-600 border-rose-500 text-white shadow-glow-rose'
                  : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700'
                }`}
            >
              <Flame size={12} />
              Priority Hotspots
            </button>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-1 text-slate-500 text-xxs font-bold uppercase">
              <SlidersHorizontal size={12} />
              Filter Severity:
            </div>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as ComplaintPriority | 'all')}
              className="bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-2 text-xxs font-semibold outline-none text-slate-300 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Map View Canvas */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800/60 shadow-xl relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-50">
            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <MapContainer
            key={`${mapCenter[0]}-${mapCenter[1]}`}
            center={mapCenter}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="dark:opacity-85 dark:invert dark:hue-rotate-[180deg]"
            />

            {/* Standard Markers */}
            {!showHeatmap && complaints && complaints.map(c => (
              <Marker
                key={c.id}
                position={[c.location.lat, c.location.lng]}
                icon={createCustomIcon(c.priority)}
              >
                <Popup>
                  <div className="flex flex-col gap-2 w-48 text-slate-100 p-0.5">
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt={c.title} className="w-full h-24 object-cover rounded-lg border border-slate-800" />
                    )}
                    <div>
                      <h4 className="font-bold text-xs leading-snug text-white">{c.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.location.address}</p>
                    </div>

                    <div className="flex gap-1 items-center mt-1 scale-90 origin-left">
                      <Badge type="priority" value={c.priority} />
                      <Badge type="status" value={c.status} />
                    </div>

                    <button
                      onClick={() => navigate(`/complaints/${c.id}`)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-[9px] uppercase py-1.5 rounded-lg transition-colors mt-2"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Hotspots Zones circle overlay */}
            {showHeatmap && heatmapData && heatmapData.map((pt, idx) => (
              <Circle
                key={idx}
                center={[pt.lat, pt.lng]}
                radius={250} // Radius in meters
                pathOptions={{
                  fillColor: getHeatmapColor(pt.intensity),
                  fillOpacity: 0.35,
                  color: getHeatmapColor(pt.intensity),
                  weight: 1,
                  dashArray: '4,4'
                }}
              />
            ))}
          </MapContainer>
        )}

        {/* Floating map legend info */}
        <div className="absolute bottom-5 left-5 z-[1000] p-3 rounded-xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-[10px] font-bold text-slate-400 uppercase tracking-wider flex flex-col gap-1.5 shadow-2xl">
          <p className="border-b border-slate-800 pb-1 mb-1 text-slate-200">Incident Severity</p>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />Critical</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />High</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />Medium</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />Low</div>
        </div>
      </div>

    </div>
  );
};
export default MapViewPage;
