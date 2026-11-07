import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Layers, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  type: 'job' | 'worker' | 'workplace';
  verified?: boolean;
  distanceKm?: number | null;
  onSelect?: () => void;
}

interface InteractiveMapViewProps {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  centerLabel?: string;
  items: MapMarkerItem[];
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  centerLat,
  centerLng,
  radiusKm,
  centerLabel = 'Your Location',
  items,
  selectedItemId,
  onSelectItem,
  onLocationChange,
  className = 'h-[460px] w-full rounded-2xl overflow-hidden'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: radiusKm <= 10 ? 12 : radiusKm <= 30 ? 11 : 10,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Custom attribution
    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | © OpenStreetMap contributors' }).addTo(map);

    // Zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Click on map to update search location if handler provided
    if (onLocationChange) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });
    }

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center & radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([centerLat, centerLng], map.getZoom());

    if (circleLayerRef.current) {
      circleLayerRef.current.remove();
    }

    // Draw radius geofence circle
    circleLayerRef.current = L.circle([centerLat, centerLng], {
      radius: radiusKm * 1000,
      color: '#2563EB',
      fillColor: '#3B82F6',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);

    // Center marker (User / Search point)
    const centerIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #2563EB; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const userMarker = L.marker([centerLat, centerLng], { icon: centerIcon })
      .bindPopup(`<strong style="font-size: 12px;">📍 ${centerLabel}</strong><br/><span style="font-size: 11px; color: #64748b;">Search Radius: ${radiusKm} KM</span>`);

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
      markersLayerRef.current.addLayer(userMarker);
    }
  }, [centerLat, centerLng, radiusKm, centerLabel]);

  // Update Item Markers (Jobs, Workers, Workplaces)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    items.forEach((item) => {
      const isSelected = item.id === selectedItemId;
      const isJob = item.type === 'job';
      const isWorkplace = item.type === 'workplace';

      const bgColor = isSelected
        ? '#10B981'
        : isJob
        ? '#2563EB'
        : isWorkplace
        ? '#7C3AED'
        : '#F59E0B';

      const iconChar = isJob ? '💼' : isWorkplace ? '🏢' : '👷';

      const customIcon = L.divIcon({
        className: 'custom-entity-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            background: ${bgColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${iconChar}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const distLabel = item.distanceKm !== undefined && item.distanceKm !== null
        ? `${item.distanceKm.toFixed(1)} km away`
        : 'Nearby';

      const popupHtml = `
        <div style="font-family: inherit; min-width: 170px; padding: 2px;">
          <div style="font-size: 10px; font-weight: 800; color: ${bgColor}; text-transform: uppercase;">
            ${item.type.toUpperCase()} • ${distLabel}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #111827; margin-top: 2px;">
            ${item.title}
          </div>
          <div style="font-size: 11px; color: #4b5563; margin-top: 1px;">
            ${item.subtitle}
          </div>
          ${item.badge ? `<span style="display: inline-block; margin-top: 4px; padding: 1px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; background: #e0f2fe; color: #0369a1;">${item.badge}</span>` : ''}
        </div>
      `;

      const marker = L.marker([item.lat, item.lng], { icon: customIcon })
        .bindPopup(popupHtml)
        .on('click', () => {
          if (onSelectItem) onSelectItem(item.id);
          if (item.onSelect) item.onSelect();
        });

      layer.addLayer(marker);
    });
  }, [items, selectedItemId, onSelectItem]);

  return (
    <div className={`relative ${className} border border-gray-200 shadow-sm`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-gray-100 flex items-center gap-2 text-xs">
        <Compass className="w-4 h-4 text-blue-600 animate-spin" />
        <span className="font-bold text-gray-800">
          Showing within {radiusKm} KM ({items.length} mapped)
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-100 flex items-center gap-3 text-[11px] font-semibold text-gray-700 hidden sm:flex">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Jobs</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Workers</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Selected</span>
        </span>
      </div>
    </div>
  );
};
