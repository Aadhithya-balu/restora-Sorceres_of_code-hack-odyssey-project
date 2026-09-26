import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Facility } from '../types';
import { 
  Crosshair, Plus, Minus, Layers, Maximize2, Minimize2, 
  Compass, Navigation, Star, X, CheckCircle, Clock, ExternalLink,
  ChevronsUpDown
} from 'lucide-react';

// Fix Leaflet default icon paths
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Haversine distance calculator for on-map distance labels
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Map Layer Configurations
export type MapLayerType = 'street' | 'satellite' | 'hot' | 'osm';

interface MapLayerConfig {
  id: MapLayerType;
  label: string;
  badge: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  labelsOverlayUrl?: string;
}

const MAP_LAYERS: Record<MapLayerType, MapLayerConfig> = {
  street: {
    id: 'street',
    label: 'Street Navigation',
    badge: '🗺️ Clean Street',
    // ESRI World Street Map: Clean, high-resolution road cartography, 100% Free, NO WATERMARK
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, TomTom',
    maxZoom: 19
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite Hybrid',
    badge: '🛰️ Real Imagery',
    // ESRI World Imagery + World Reference Labels: 100% Free, NO WATERMARK
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsOverlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid',
    maxZoom: 19
  },
  hot: {
    id: 'hot',
    label: 'Humanitarian / Contrast',
    badge: '⚡ High Contrast',
    // OpenStreetMap Humanitarian: High readability, pastel streets and parks, NO WATERMARK
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
    subdomains: ['a', 'b']
  },
  osm: {
    id: 'osm',
    label: 'Classic OSM',
    badge: '🧭 OpenStreetMap',
    // OpenStreetMap Standard: 100% Free, NO WATERMARK
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
};

// Category Configuration with Real Map Color Palette
interface CategoryVisual {
  emoji: string;
  color: string;
  textColor: string;
  label: string;
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  WASHROOM: { emoji: '🚻', color: '#059669', textColor: '#FFFFFF', label: 'Washroom' },
  WATER: { emoji: '💧', color: '#0284C7', textColor: '#FFFFFF', label: 'Drinking Water' },
  CHARGING: { emoji: '🔋', color: '#D97706', textColor: '#FFFFFF', label: 'Charging' },
  FOOD: { emoji: '🍱', color: '#E11D48', textColor: '#FFFFFF', label: 'Food & Meals' },
  PETROL_PUMP: { emoji: '⛽', color: '#475569', textColor: '#FFFFFF', label: 'Petrol Pump' },
  REST_POINT: { emoji: '🌳', color: '#0D9488', textColor: '#FFFFFF', label: 'Rest Seating' },
  DEFAULT: { emoji: '📍', color: '#2563EB', textColor: '#FFFFFF', label: 'Rest Hub' }
};

function getCategoryVisual(fac: Facility): CategoryVisual {
  const cat = (fac.category || '').toUpperCase();
  if (cat.includes('WASHROOM') || fac.has_washroom) return CATEGORY_VISUALS.WASHROOM;
  if (cat.includes('WATER') || fac.has_water) return CATEGORY_VISUALS.WATER;
  if (cat.includes('CHARGING') || fac.has_charging) return CATEGORY_VISUALS.CHARGING;
  if (cat.includes('FOOD') || fac.has_food) return CATEGORY_VISUALS.FOOD;
  if (cat.includes('PETROL') || cat.includes('PUMP')) return CATEGORY_VISUALS.PETROL_PUMP;
  if (cat.includes('REST') || fac.has_rest || fac.has_shade) return CATEGORY_VISUALS.REST_POINT;
  return CATEGORY_VISUALS.DEFAULT;
}

// 1. Google Maps-Style Teardrop Map Pin
const createGooglePinIcon = (fac: Facility, isSelected: boolean) => {
  const visual = getCategoryVisual(fac);
  const width = isSelected ? 40 : 32;
  const height = isSelected ? 52 : 42;
  const emojiSize = isSelected ? 17 : 14;
  const ratingText = fac.rating ? `⭐ ${fac.rating.toFixed(1)}` : '';
  const escapedName = fac.name.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return L.divIcon({
    className: `google-map-pin ${isSelected ? 'pin-selected' : ''}`,
    html: `
      <div style="position: relative; width: ${width}px; height: ${height}px; transform-origin: bottom center; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <!-- Authentic Teardrop SVG Pin with Ground Stem Point -->
        <svg width="${width}" height="${height}" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
          <!-- Ground Shadow Oval -->
          <ellipse cx="17" cy="43.5" rx="7.5" ry="2.5" fill="rgba(0,0,0,0.3)"/>
          <!-- Teardrop Pin Body -->
          <path d="M17 0C7.61 0 0 7.61 0 17C0 29.5 15.3 43.4 16.1 44.2C16.6 44.7 17.4 44.7 17.9 44.2C18.7 43.4 34 29.5 34 17C34 7.61 26.39 0 17 0Z" fill="${visual.color}"/>
          <!-- White Bezel Inner Circle -->
          <circle cx="17" cy="17" r="11.5" fill="#FFFFFF"/>
        </svg>

        <!-- Category Emoji Badge Centered -->
        <div style="
          position: absolute;
          top: ${isSelected ? 7 : 5}px;
          left: 50%;
          transform: translateX(-50%);
          font-size: ${emojiSize}px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        ">
          ${visual.emoji}
        </div>

        <!-- Floating Active Name Pill when selected -->
        ${isSelected ? `
          <div style="
            position: absolute;
            bottom: ${height + 6}px;
            left: 50%;
            transform: translateX(-50%);
            background: #0F172A;
            color: #FFFFFF;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            gap: 5px;
            border: 1px solid rgba(255,255,255,0.25);
            pointer-events: none;
            z-index: 1000;
          ">
            <span>${escapedName}</span>
            ${ratingText ? `<span style="color: #FBBF24; font-size: 10px;">${ratingText}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 2],
    popupAnchor: [0, -height],
  });
};

// 2. Google Maps-Style Live GPS Blue Dot (Iconic Location Indicator)
const createLiveGpsUserIcon = (headingDeg?: number | null) => L.divIcon({
  className: 'google-gps-user-marker',
  html: `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <!-- Pulsing Radar Halo -->
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(37, 99, 235, 0.28);
        animation: googleRadarPulse 2s infinite ease-out;
      "></div>
      
      <!-- Direction Cone if heading available -->
      ${typeof headingDeg === 'number' ? `
        <div style="
          position: absolute;
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-bottom: 18px solid rgba(37, 99, 235, 0.4);
          top: 2px;
          transform-origin: center 20px;
          transform: rotate(${headingDeg}deg);
        "></div>
      ` : ''}

      <!-- Center Solid Blue Dot with White Bezel -->
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #2563EB;
        border: 3px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        z-index: 2;
      "></div>

      <!-- Small 'You' Label Pill -->
      <div style="
        position: absolute;
        bottom: -18px;
        background: #1E3A8A;
        color: white;
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 800;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        letter-spacing: 0.03em;
        white-space: nowrap;
        pointer-events: none;
      ">
        YOU
      </div>
    </div>
    <style>
      @keyframes googleRadarPulse {
        0% { transform: scale(0.35); opacity: 1; }
        100% { transform: scale(1.65); opacity: 0; }
      }
    </style>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// 3. Searched Locality Marker (Distinct Coral/Amber Destination Pin)
const createSearchedLocalityIcon = (name: string) => L.divIcon({
  className: 'searched-locality-icon',
  html: `
    <div style="position: relative; width: 36px; height: 46px; display: flex; align-items: center; justify-content: center;">
      <svg width="32" height="42" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        <ellipse cx="17" cy="43.5" rx="7" ry="2.2" fill="rgba(0,0,0,0.25)"/>
        <path d="M17 0C7.61 0 0 7.61 0 17C0 29.5 15.3 43.4 16.1 44.2C16.6 44.7 17.4 44.7 17.9 44.2C18.7 43.4 34 29.5 34 17C34 7.61 26.39 0 17 0Z" fill="#D97706"/>
        <circle cx="17" cy="17" r="11" fill="#FFFFFF"/>
      </svg>
      <div style="position: absolute; top: 7px; left: 50%; transform: translateX(-50%); font-size: 14px;">
        📍
      </div>
      <div style="
        position: absolute;
        bottom: 48px;
        left: 50%;
        transform: translateX(-50%);
        background: #78350F;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        ${name}
      </div>
    </div>
  `,
  iconSize: [36, 46],
  iconAnchor: [18, 44],
});

// Map Controller for smooth flyTo and camera adjustments
const MapCameraController: React.FC<{
  lat: number;
  lng: number;
  radiusKm?: number;
  selectedFacility: Facility | null;
  facilities: Facility[];
}> = ({ lat, lng, radiusKm, selectedFacility, facilities }) => {
  const map = useMap();
  const prevCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (
      !prevCoords.current ||
      Math.abs(prevCoords.current.lat - lat) > 0.001 ||
      Math.abs(prevCoords.current.lng - lng) > 0.001
    ) {
      prevCoords.current = { lat, lng };

      if (radiusKm && facilities.length > 0) {
        const r = radiusKm * 1000;
        const bounds = L.latLng(lat, lng).toBounds(r * 1.15);
        // Only extend to facilities that are reasonably nearby (within 2.5x radius)
        const nearbyFacs = facilities.filter(f => {
          const d = getDistanceMeters(lat, lng, f.lat, f.lng);
          return d <= (r * 2.5);
        });
        if (nearbyFacs.length > 0) {
          nearbyFacs.slice(0, 6).forEach(f => bounds.extend([f.lat, f.lng]));
          map.flyToBounds(bounds, { duration: 0.9, maxZoom: 16 });
        } else {
          map.flyToBounds(bounds, { duration: 0.9, maxZoom: 15 });
        }
      } else {
        map.flyTo([lat, lng], 14, { duration: 0.8 });
      }
    }
  }, [lat, lng, radiusKm, map]);

  useEffect(() => {
    if (selectedFacility) {
      map.flyTo([selectedFacility.lat, selectedFacility.lng], 16, { duration: 0.6 });
    }
  }, [selectedFacility, map]);

  return null;
};

// Scale bar component (Google Maps style distance context)
const MapScaleControl: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ imperial: false, metric: true, position: 'bottomleft' });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);
  return null;
};

// Deselect active facility when clicking anywhere on empty map space
const MapBackgroundClickHandler: React.FC<{ onDeselect: () => void }> = ({ onDeselect }) => {
  useMapEvents({
    click: () => {
      onDeselect();
    }
  });
  return null;
};

// Automatically invalidate Leaflet map size on mount, container resize, and mode switches
const MapResizeInvalidator: React.FC<{ triggerKey?: any }> = ({ triggerKey }) => {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 60);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, triggerKey]);

  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  return null;
};

// In-map Google Maps Style Floating Controls
interface MapFloatingControlsProps {
  onRecenter?: () => void;
  isManualSearch: boolean;
  activeLayer: MapLayerType;
  onChangeLayer: (layer: MapLayerType) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleHeightMode?: () => void;
  isTallMode?: boolean;
  userLat?: number | null;
  userLng?: number | null;
}

const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  onRecenter,
  isManualSearch,
  activeLayer,
  onChangeLayer,
  onToggleFullscreen,
  isFullscreen,
  onToggleHeightMode,
  isTallMode,
  userLat,
  userLng
}) => {
  const map = useMap();
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const handleCompassClick = () => {
    if (userLat && userLng) {
      map.flyTo([userLat, userLng], map.getZoom(), { duration: 0.5 });
    } else {
      map.panTo(map.getCenter());
    }
  };

  return (
    <>
      {/* TOP-RIGHT CONTROLS: Layers, Compass, Fullscreen */}
      <div style={{
        position: 'absolute',
        top: 14,
        right: 14,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'auto'
      }}>
        {/* Layer Switcher Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Map Style (Street, Satellite, Night Mode)"
            aria-label="Toggle Map Styles"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.12)',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Layers size={18} color="var(--primary)" />
          </button>

          {/* Layer Selection Menu Popover */}
          {showLayerMenu && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 46,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid var(--border)',
              padding: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 170,
              zIndex: 1001
            }}>
              {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((key) => {
                const layer = MAP_LAYERS[key];
                const isActive = activeLayer === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChangeLayer(key);
                      setShowLayerMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary-dark)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      textAlign: 'left'
                    }}
                  >
                    <span>{layer.badge} {layer.label}</span>
                    {isActive && <CheckCircle size={14} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Compass / North Reorient Button */}
        <button
          type="button"
          onClick={handleCompassClick}
          title="Align Camera North"
          aria-label="Compass Align North"
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            backgroundColor: '#FFFFFF',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            cursor: 'pointer'
          }}
        >
          <Compass size={19} />
        </button>

        {/* Map Height Mode Quick Toggle (Standard / Tall) */}
        {onToggleHeightMode && (
          <button
            type="button"
            onClick={onToggleHeightMode}
            title={isTallMode ? 'Compress to Standard Height' : 'Expand to Tall Map View'}
            aria-label="Toggle Tall Map View"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.12)',
              backgroundColor: isTallMode ? '#EFF6FF' : '#FFFFFF',
              color: isTallMode ? '#2563EB' : '#1F2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <ChevronsUpDown size={18} />
          </button>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen Map'}
          aria-label="Toggle Fullscreen Map"
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            backgroundColor: '#FFFFFF',
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            cursor: 'pointer'
          }}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>

      {/* BOTTOM-RIGHT CONTROLS: Zoom Pill & My Location FAB */}
      <div style={{
        position: 'absolute',
        right: 14,
        bottom: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'auto'
      }}>
        {/* Recenter / My Location FAB */}
        {onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            title={isManualSearch ? 'Revert to My Live GPS' : 'Recenter on My Location'}
            aria-label="Recenter on My Location"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: isManualSearch ? '#D97706' : '#2563EB',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background-color 0.2s'
            }}
          >
            <Crosshair size={21} />
          </button>
        )}

        {/* Google Maps Style Combined Zoom Pill (+ / -) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.12)',
          overflow: 'hidden'
        }}>
          <button
            type="button"
            onClick={() => map.zoomIn()}
            aria-label="Zoom In"
            title="Zoom in"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'none',
              color: '#1F2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
          </button>

          <div style={{ width: '100%', height: 1, backgroundColor: '#E2E8F0' }} />

          <button
            type="button"
            onClick={() => map.zoomOut()}
            aria-label="Zoom Out"
            title="Zoom out"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'none',
              color: '#1F2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Minus size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

// Main Component
export interface InteractiveMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility | null) => void;
  onOpenDetails?: (facility: Facility) => void;
  userLat?: number | null;
  userLng?: number | null;
  accuracy?: number | null;
  searchRadiusKm?: number;
  height?: string | number;
  isManualSearch?: boolean;
  manualLocationName?: string;
  onRecenter?: () => void;
  onToggleHeightMode?: () => void;
  isTallMode?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenDetails,
  userLat,
  userLng,
  accuracy,
  searchRadiusKm,
  height = '100%',
  isManualSearch = false,
  manualLocationName = 'Searched Corridor',
  onRecenter,
  onToggleHeightMode,
  isTallMode = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('street');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default to Peelamedu/Coimbatore corridor if position not yet available
  const centerLat = userLat ?? 11.0267;
  const centerLng = userLng ?? 77.0118;

  const currentLayerConfig = MAP_LAYERS[activeLayer];

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Distance to selected facility
  const selectedDistanceMeters = (selectedFacility && userLat && userLng)
    ? getDistanceMeters(userLat, userLng, selectedFacility.lat, selectedFacility.lng)
    : null;

  const selectedVisual = selectedFacility ? getCategoryVisual(selectedFacility) : null;

  return (
    <div
      ref={containerRef}
      className={`interactive-map-root ${isFullscreen ? 'interactive-map-fullscreen' : ''}`}
      style={{
        width: '100%',
        height: isFullscreen ? '100vh' : height,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#E5E7EB'
      }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        {/* Base Cartography Tiles */}
        <TileLayer
          key={currentLayerConfig.id}
          url={currentLayerConfig.url}
          attribution={currentLayerConfig.attribution}
          maxZoom={currentLayerConfig.maxZoom}
          subdomains={currentLayerConfig.subdomains || ['a', 'b', 'c', 'd']}
        />

        {/* Optional Street Labels Overlay (for Satellite Hybrid mode) */}
        {currentLayerConfig.labelsOverlayUrl && (
          <TileLayer
            key={`${currentLayerConfig.id}-labels`}
            url={currentLayerConfig.labelsOverlayUrl}
            attribution=""
            maxZoom={currentLayerConfig.maxZoom}
            subdomains={currentLayerConfig.subdomains || ['a', 'b', 'c', 'd']}
            pane="overlayPane"
          />
        )}

        <MapScaleControl />
        <MapBackgroundClickHandler onDeselect={() => onSelectFacility(null)} />
        <MapResizeInvalidator triggerKey={`${height}-${isFullscreen}-${isTallMode}`} />

        {/* Camera Tracking Controller */}
        {typeof userLat === 'number' && typeof userLng === 'number' && (
          <>
            <MapCameraController
              lat={userLat}
              lng={userLng}
              radiusKm={searchRadiusKm}
              selectedFacility={selectedFacility}
              facilities={facilities}
            />

            {/* GPS Accuracy Circle (only for live GPS when accuracy is reasonable) */}
            {!isManualSearch && accuracy && accuracy > 0 && accuracy < 600 && (
              <Circle
                center={[userLat, userLng]}
                radius={accuracy}
                pathOptions={{
                  color: '#2563EB',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: '3 3'
                }}
              />
            )}

            {/* Adaptive Search Radius Boundary */}
            {searchRadiusKm && (
              <Circle
                center={[userLat, userLng]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: isManualSearch ? '#D97706' : '#0D9488',
                  fillColor: isManualSearch ? '#F59E0B' : '#14B8A6',
                  fillOpacity: 0.03,
                  weight: 1.5,
                  dashArray: '5 5'
                }}
              />
            )}

            {/* User Location Marker: Live GPS Blue Dot vs Searched Locality Pin */}
            <Marker
              position={[userLat, userLng]}
              icon={isManualSearch ? createSearchedLocalityIcon(manualLocationName) : createLiveGpsUserIcon()}
              zIndexOffset={3000}
            >
              <Popup className="google-style-popup">
                <div style={{ padding: '6px 8px', minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isManualSearch ? '#D97706' : '#2563EB' }} />
                    <strong style={{ fontSize: 13, color: isManualSearch ? '#B45309' : '#1D4ED8' }}>
                      {isManualSearch ? manualLocationName : 'Your Live GPS Location'}
                    </strong>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#4B5563' }}>
                    {isManualSearch
                      ? 'Manually selected search corridor.'
                      : accuracy
                      ? `Accurate to within ±${Math.round(accuracy)} meters.`
                      : 'Live satellite GPS fix.'}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Facility Markers: Authentic Teardrop Map Pins */}
        {facilities.map((fac) => {
          const isSelected = selectedFacility?.id === fac.id;
          return (
            <Marker
              key={fac.id}
              position={[fac.lat, fac.lng]}
              icon={createGooglePinIcon(fac, isSelected)}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e as any);
                  if (selectedFacility?.id === fac.id) {
                    onSelectFacility(null);
                  } else {
                    onSelectFacility(fac);
                  }
                },
              }}
              zIndexOffset={isSelected ? 2500 : 500}
            >
              <Popup className="google-style-popup">
                <div style={{ padding: '6px 8px', maxWidth: 230 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 6,
                      backgroundColor: getCategoryVisual(fac).color,
                      color: '#FFFFFF'
                    }}>
                      {getCategoryVisual(fac).label.toUpperCase()}
                    </span>
                    {fac.rating && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                        ⭐ {fac.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h4 style={{ margin: '2px 0 4px', fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>
                    {fac.name}
                  </h4>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748B', lineHeight: 1.3 }}>
                    {fac.address}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenDetails) onOpenDetails(fac);
                        else onSelectFacility(fac);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                    >
                      Details
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Navigation size={12} /> Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Floating Google Maps Controls */}
        <MapFloatingControls
          onRecenter={onRecenter}
          isManualSearch={isManualSearch}
          activeLayer={activeLayer}
          onChangeLayer={setActiveLayer}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleHeightMode={onToggleHeightMode}
          isTallMode={isTallMode}
          userLat={userLat}
          userLng={userLng}
        />
      </MapContainer>

      {/* GOOGLE MAPS STYLE BOTTOM FLOATING CARD (When pin selected) */}
      {selectedFacility && selectedVisual && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 80, // Leave room for bottom-right zoom & recenter stack
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: '12px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0,0,0,0.08)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          animation: 'googleSlideUp 0.25s ease-out'
        }}>
          {/* Header row: Category, Verification & Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 6,
                backgroundColor: selectedVisual.color,
                color: '#FFFFFF',
                letterSpacing: '0.02em'
              }}>
                {selectedVisual.emoji} {selectedVisual.label.toUpperCase()}
              </span>

              {selectedFacility.verification_status === 'VERIFIED' && (
                <span className="badge badge-verified" style={{ fontSize: 10, padding: '2px 6px' }}>
                  <CheckCircle size={10} /> Verified
                </span>
              )}

              {selectedFacility.is_24_7 ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} /> Open 24/7
                </span>
              ) : selectedFacility.is_open ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>
                  ● Open Now
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFacility(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Dismiss spot preview"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title & Distance */}
          <div>
            <h4 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              {selectedFacility.name}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
              {selectedFacility.rating && (
                <span style={{ fontWeight: 700, color: '#D97706', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={12} fill="#D97706" /> {selectedFacility.rating.toFixed(1)}
                  {selectedFacility.review_count ? ` (${selectedFacility.review_count})` : ''}
                </span>
              )}
              {selectedDistanceMeters !== null && (
                <span>📍 <strong>{formatDistance(selectedDistanceMeters)}</strong> away</span>
              )}
              {selectedFacility.zone && (
                <span>• {selectedFacility.zone}</span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons: Directions & Details */}
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                flex: 1,
                justifyContent: 'center',
                backgroundColor: '#2563EB',
                fontWeight: 700,
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 8
              }}
            >
              <Navigation size={14} /> Turn-by-Turn Directions
            </a>

            {onOpenDetails && (
              <button
                type="button"
                onClick={() => onOpenDetails(selectedFacility)}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '7px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 8
                }}
              >
                Full Details
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global CSS for Google Maps-Style Popups and Pin Animations */}
      <style>{`
        @keyframes googleSlideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .google-map-pin {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .google-map-pin:hover {
          transform: scale(1.12);
        }

        .google-map-pin.pin-selected {
          z-index: 2500 !important;
          animation: googlePinBounce 0.4s ease;
        }

        @keyframes googlePinBounce {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }

        /* Modern Leaflet Popup overrides for Google Maps feel */
        .google-style-popup .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          padding: 4px !important;
        }

        .google-style-popup .leaflet-popup-content {
          margin: 8px 10px !important;
          line-height: 1.4 !important;
        }

        .google-style-popup .leaflet-popup-tip {
          background: #FFFFFF !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15) !important;
        }

        /* Scale Bar Styling */
        .leaflet-control-scale-line {
          background: rgba(255, 255, 255, 0.85) !important;
          border: 1px solid #94A3B8 !important;
          border-top: none !important;
          border-radius: 0 0 3px 3px !important;
          color: #334155 !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12) !important;
        }

        .interactive-map-fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 99999 !important;
        }
      `}</style>
    </div>
  );
};
