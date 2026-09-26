import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import type { Complaint } from '../types/complaint';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override default marker options to resolve Vite/Webpack resolution issues in production
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLatLng?: [number, number] | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  complaints,
  center = [37.7749, -122.4194],
  zoom = 13,
  interactive = true,
  onMapClick,
  selectedLatLng
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Initialize Map Container
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive
    });

    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Ensure map tiles recalculate container dimensions properly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    if (interactive && onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Synchronize Center & Zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [center, zoom]);

  // 3. Dynamic Tile Theme Synchronization
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    });

    tiles.addTo(mapRef.current);
    tileLayerRef.current = tiles;
  }, [theme]);

  // 4. Update markers dynamically
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Render complaints list markers
    complaints.forEach(complaint => {
      let color = '#22c55e'; // Green
      if (complaint.priority === 'critical') color = '#e11d48';
      else if (complaint.priority === 'high') color = '#f59e0b';
      else if (complaint.priority === 'medium') color = '#eab308';

      const markerHtml = `
        <div style="
          width: 14px; 
          height: 14px; 
          background-color: ${color}; 
          border: 2px solid ${theme === 'dark' ? '#0f172a' : '#ffffff'}; 
          border-radius: 50%;
          box-shadow: 0 0 8px ${color}80;
        "></div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-complaint-marker',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([complaint.location.lat, complaint.location.lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'inherit';
      popupContent.style.fontSize = '11px';
      popupContent.style.color = theme === 'dark' ? '#f8fafc' : '#0f172a';
      popupContent.style.padding = '4px';
      popupContent.style.maxWidth = '180px';
      
      popupContent.innerHTML = `
        ${complaint.imageUrl ? `<img src="${complaint.imageUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
        <h4 style="margin: 0; font-weight: 700; font-size: 12px; color: ${theme === 'dark' ? '#ffffff' : '#0f172a'};">${complaint.title}</h4>
        <p style="margin: 2px 0 6px 0; color: #64748b; font-size: 9px;">${complaint.location.address}</p>
        <div style="display: flex; gap: 4px; margin-bottom: 6px;">
          <span style="background: ${color}20; color: ${color}; padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase;">
            ${complaint.priority}
          </span>
          <span style="background: ${theme === 'dark' ? '#334155' : '#e2e8f0'}; color: ${theme === 'dark' ? '#cbd5e1' : '#475569'}; padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase;">
            ${complaint.status}
          </span>
        </div>
        <div style="border-top: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}; padding-top: 4px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="font-size: 8px; color: #64748b;">${complaint.reportsCount} report${complaint.reportsCount > 1 ? 's' : ''}</span>
          <button id="view-details-${complaint.id}" style="border: none; background: none; color: #2563eb; font-weight: 700; cursor: pointer; font-size: 8px; padding: 0; text-decoration: underline;">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${complaint.id}`);
        if (btn) {
          btn.onclick = () => {
            navigate(`/complaints/${complaint.id}`);
          };
        }
      });

      markersGroup.addLayer(marker);
    });

    // Render selected specific spot marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (selectedLatLng) {
      const selectedHtml = `
        <div style="
          width: 16px; 
          height: 16px; 
          background-color: #2563eb; 
          border: 2px solid #ffffff; 
          border-radius: 50%;
          box-shadow: 0 0 10px #2563eb80;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
        </div>
      `;

      const selectedIcon = L.divIcon({
        html: selectedHtml,
        className: 'custom-selected-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const selectedMarker = L.marker(selectedLatLng, { icon: selectedIcon });
      selectedMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; color: ${theme === 'dark' ? '#f8fafc' : '#0f172a'}; padding: 2px;">
          <p style="margin: 0; font-weight: 700;">Pinned Complaint Spot</p>
          <p style="margin: 2px 0 0 0; color: #64748b; font-size: 9px;">Lat: ${selectedLatLng[0].toFixed(5)}, Lng: ${selectedLatLng[1].toFixed(5)}</p>
        </div>
      `);

      selectedMarker.addTo(map);
      selectedMarkerRef.current = selectedMarker;
    }
  }, [complaints, selectedLatLng, theme, navigate]);

  return (
    <div className="w-full h-full relative min-h-[350px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800/40 bg-slate-900/10 dark:bg-slate-950/20">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px]" />
    </div>
  );
};

export default MapComponent;
