import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Facility } from '../types';
import { Crosshair, Plus, Minus } from 'lucide-react';

// Fix Leaflet default icon paths
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Category-specific icons
const createCategoryIcon = (emoji: string, color: string, isSelected: boolean = false) => {
  const size = isSelected ? 38 : 30;
  const shadow = isSelected ? '0 4px 14px rgba(0,0,0,0.45)' : '0 2px 6px rgba(0,0,0,0.25)';
  const border = isSelected ? `2.5px solid #fff` : `2px solid #fff`;
  
  return L.divIcon({
    className: 'category-leaflet-icon',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isSelected ? 19 : 15}px;
      border: ${border};
      box-shadow: ${shadow};
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      transform: ${isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)'};
      z-index: ${isSelected ? 1000 : 1};
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const getCategoryIcon = (
  category: string,
  hasFood: boolean,
  hasWashroom: boolean,
  hasWater: boolean,
  hasCharging: boolean,
  isSelected: boolean
) => {
  const catUpper = (category || '').toUpperCase();
  if (catUpper.includes('WASHROOM') || hasWashroom) return createCategoryIcon('🚻', '#059669', isSelected);
  if (catUpper.includes('WATER') || hasWater) return createCategoryIcon('💧', '#2563EB', isSelected);
  if (catUpper.includes('CHARGING') || hasCharging) return createCategoryIcon('🔋', '#D97706', isSelected);
  if (catUpper.includes('FOOD') || hasFood) return createCategoryIcon('🍱', '#DC2626', isSelected);
  if (catUpper.includes('PETROL') || catUpper.includes('PUMP')) return createCategoryIcon('⛽', '#4B5563', isSelected);
  return createCategoryIcon('🌳', '#4F46E5', isSelected);
};

// 1. Live GPS User Marker (Pulsing Blue)
const liveGpsUserIcon = L.divIcon({
  className: 'user-live-gps-icon',
  html: `<div style="
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(37, 99, 235, 0.25);
      border-radius: 50%;
      animation: restoraPulse 2s infinite ease-out;
    "></div>
    <div style="
      background-color: #2563EB;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      z-index: 2;
    "></div>
    <div style="
      position: absolute;
      top: -22px;
      background: #1E3A8A;
      color: white;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      white-space: nowrap;
      pointer-events: none;
    ">You (Live GPS)</div>
  </div>
  <style>
    @keyframes restoraPulse {
      0% { transform: scale(0.45); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  </style>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// 2. Searched Locality Marker (Distinct Amber/Purple Pin - Never falsely claimed as GPS)
const searchedLocalityIcon = (name: string) => L.divIcon({
  className: 'searched-locality-icon',
  html: `<div style="
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      background-color: #D97706;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(217, 119, 6, 0.5);
      z-index: 2;
    "></div>
    <div style="
      position: absolute;
      top: -24px;
      background: #78350F;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      white-space: nowrap;
      pointer-events: none;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
    ">📍 ${name}</div>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Map Controller for smooth flyTo and camera adjustments
const MapController: React.FC<{
  lat: number;
  lng: number;
  radiusKm?: number;
  selectedFacility: Facility | null;
  facilities: Facility[];
}> = ({ lat, lng, radiusKm, selectedFacility, facilities }) => {
  const map = useMap();
  const prevCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Only animate camera if coordinates actually changed significantly
    if (
      !prevCoords.current ||
      Math.abs(prevCoords.current.lat - lat) > 0.001 ||
      Math.abs(prevCoords.current.lng - lng) > 0.001
    ) {
      prevCoords.current = { lat, lng };

      if (radiusKm && facilities.length > 0) {
        const r = radiusKm * 1000;
        const bounds = L.latLng(lat, lng).toBounds(r * 1.15);
        facilities.slice(0, 5).forEach(f => bounds.extend([f.lat, f.lng]));
        map.flyToBounds(bounds, { duration: 0.9, maxZoom: 16 });
      } else {
        map.flyTo([lat, lng], 14, { duration: 0.8 });
      }
    }
  }, [lat, lng, radiusKm, map]);

  useEffect(() => {
    if (selectedFacility) {
      map.flyTo([selectedFacility.lat, selectedFacility.lng], 15, { duration: 0.5 });
    }
  }, [selectedFacility, map]);

  return null;
};

// In-map custom control overlay
const MapFloatingControls: React.FC<{
  onRecenter: () => void;
  isManualSearch: boolean;
  onClearManualSearch?: () => void;
}> = ({ onRecenter, isManualSearch, onClearManualSearch }) => {
  const map = useMap();

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      bottom: 100,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'auto'
    }}>
      {/* Zoom In */}
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom In"
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <Plus size={18} />
      </button>

      {/* Zoom Out */}
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom Out"
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)',
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
      >
        <Minus size={18} />
      </button>

      {/* Recenter / My Location FAB */}
      <button
        onClick={onRecenter}
        title={isManualSearch ? 'Revert to My Live GPS' : 'Recenter on My Location'}
        aria-label="Recenter Map"
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isManualSearch ? '#D97706' : '#2563EB',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginTop: 4
        }}
      >
        <Crosshair size={20} />
      </button>
    </div>
  );
};

interface InteractiveMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  userLat?: number | null;
  userLng?: number | null;
  accuracy?: number | null;
  searchRadiusKm?: number;
  height?: string | number;
  isManualSearch?: boolean;
  manualLocationName?: string;
  onRecenter?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  userLat,
  userLng,
  accuracy,
  searchRadiusKm,
  height = '100%',
  isManualSearch = false,
  manualLocationName = 'Searched Corridor',
  onRecenter
}) => {
  // Default to Peelamedu/Coimbatore corridor if position not yet available
  const centerLat = userLat ?? 11.0267;
  const centerLng = userLng ?? 77.0118;

  return (
    <div style={{
      width: '100%',
      height: height,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#f1f5f9'
    }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {typeof userLat === 'number' && typeof userLng === 'number' && (
          <>
            <MapController
              lat={userLat}
              lng={userLng}
              radiusKm={searchRadiusKm}
              selectedFacility={selectedFacility}
              facilities={facilities}
            />

            {/* GPS Accuracy Circle (only for live GPS, when accuracy is reasonable) */}
            {!isManualSearch && accuracy && accuracy > 0 && accuracy < 500 && (
              <Circle
                center={[userLat, userLng]}
                radius={accuracy}
                pathOptions={{
                  color: '#2563EB',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: '3 3'
                }}
              />
            )}

            {/* Adaptive Search Radius Circle */}
            {searchRadiusKm && (
              <Circle
                center={[userLat, userLng]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: isManualSearch ? '#D97706' : '#2563EB',
                  fillColor: isManualSearch ? '#F59E0B' : '#3B82F6',
                  fillOpacity: 0.04,
                  weight: 1.5,
                  dashArray: '5 5'
                }}
              />
            )}

            {/* User Location Marker: Live GPS vs Searched Locality */}
            <Marker
              position={[userLat, userLng]}
              icon={isManualSearch ? searchedLocalityIcon(manualLocationName) : liveGpsUserIcon}
              zIndexOffset={3000}
            >
              <Popup>
                <div style={{ padding: 4, minWidth: 160 }}>
                  <strong style={{ fontSize: 13, color: isManualSearch ? '#B45309' : '#1D4ED8' }}>
                    {isManualSearch ? `📍 ${manualLocationName}` : '📍 Your Current Position'}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4B5563' }}>
                    {isManualSearch
                      ? 'Manually selected search corridor.'
                      : accuracy
                      ? `Accurate to ~${accuracy} meters.`
                      : 'Live GPS location.'}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Facility Markers */}
        {facilities.map((fac) => {
          const isSelected = selectedFacility?.id === fac.id;
          return (
            <Marker
              key={fac.id}
              position={[fac.lat, fac.lng]}
              icon={getCategoryIcon(
                fac.category,
                fac.has_food,
                fac.has_washroom,
                fac.has_water,
                fac.has_charging,
                isSelected
              )}
              eventHandlers={{
                click: () => onSelectFacility(fac),
              }}
              zIndexOffset={isSelected ? 2000 : 500}
            >
              <Popup>
                <div style={{ padding: 4, maxWidth: 220 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                    {fac.category.replace('_', ' ')}
                  </div>
                  <h4 style={{ margin: '2px 0 4px', fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
                    {fac.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>
                    {fac.address}
                  </p>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onSelectFacility(fac)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: 4,
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      Directions ↗
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Floating Controls */}
        {onRecenter && (
          <MapFloatingControls
            onRecenter={onRecenter}
            isManualSearch={isManualSearch}
          />
        )}
      </MapContainer>
    </div>
  );
};
