import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Facility } from '../types';

// Fix Leaflet's default icon paths
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
  const size = isSelected ? 36 : 28;
  const shadow = isSelected ? '0 4px 12px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.2)';
  const border = isSelected ? `2px solid #fff` : `1.5px solid #fff`;
  
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
      font-size: ${isSelected ? 18 : 14}px;
      border: ${border};
      box-shadow: ${shadow};
      transition: all 0.3s ease;
      transform: ${isSelected ? 'translateY(-4px)' : 'none'};
      z-index: ${isSelected ? 1000 : 1};
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const getCategoryIcon = (category: string, hasFood: boolean, hasWashroom: boolean, hasWater: boolean, hasCharging: boolean, isSelected: boolean) => {
  // Determine primary visual category
  if (category === 'WASHROOM' || hasWashroom) return createCategoryIcon('🚻', '#059669', isSelected);
  if (category === 'WATER' || hasWater) return createCategoryIcon('💧', '#2563EB', isSelected);
  if (category === 'CHARGING' || hasCharging) return createCategoryIcon('🔋', '#D97706', isSelected);
  if (category === 'FOOD' || hasFood) return createCategoryIcon('🍱', '#DC2626', isSelected);
  return createCategoryIcon('🌳', '#4F46E5', isSelected); // Default Rest/Shade
};

const userIcon = L.divIcon({
  className: 'user-leaflet-icon',
  html: `<div style="
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: rgba(37, 99, 235, 0.2);
      border-radius: 50%;
      animation: pulse 2s infinite ease-out;
    "></div>
    <div style="
      background-color: #2563EB;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 2;
    "></div>
    <div style="
      position: absolute;
      top: -20px;
      background: white;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      color: #2563EB;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      white-space: nowrap;
    ">You</div>
  </div>
  <style>
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  </style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Component to handle map center updates when user location changes or radius changes
const MapUpdater: React.FC<{ lat: number; lng: number; radiusKm?: number; facilities: Facility[] }> = ({ lat, lng, radiusKm, facilities }) => {
  const map = useMap();
  useEffect(() => {
    if (radiusKm) {
      // Create bounds based on the circular radius
      const r = radiusKm * 1000;
      const bounds = L.latLng(lat, lng).toBounds(r * 1.2); // add 20% padding visually
      
      // If we have facilities outside this theoretical bound (shouldn't happen with correct filter, but just in case)
      facilities.forEach(f => bounds.extend([f.lat, f.lng]));
      
      map.flyToBounds(bounds, { duration: 0.8, easeLinearity: 0.25 });
    } else if (facilities.length > 0) {
      const bounds = L.latLngBounds(facilities.map(f => [f.lat, f.lng]));
      bounds.extend([lat, lng]);
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 0.8 });
    } else {
      map.flyTo([lat, lng], 13, { duration: 0.8 });
    }
  }, [lat, lng, radiusKm, map]); // purposefully omit facilities so it doesn't jump aggressively on small changes
  return null;
};

interface InteractiveMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  userLat?: number | null;
  userLng?: number | null;
  searchRadiusKm?: number;
  height?: string | number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  userLat,
  userLng,
  searchRadiusKm,
  height = '420px'
}) => {
  // Default to a central location (e.g., Coimbatore) if user location is not available yet
  const centerLat = userLat ?? 11.0168;
  const centerLng = userLng ?? 76.9558;

  return (
    <div style={{
      width: '100%',
      height: height,
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }}>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {typeof userLat === 'number' && typeof userLng === 'number' && (
          <>
            <MapUpdater lat={userLat} lng={userLng} radiusKm={searchRadiusKm} facilities={facilities} />
            
            {/* Search Radius Circle */}
            {searchRadiusKm && (
              <Circle
                center={[userLat, userLng]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: 'var(--primary)',
                  fillColor: 'var(--primary)',
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: '4 4'
                }}
              />
            )}
            
            <Marker position={[userLat, userLng]} icon={userIcon} zIndexOffset={2000}>
            </Marker>
          </>
        )}

        {/* Reverse array so the closest ones (at start of array) are drawn last and appear on top,
            except selected which should be at the very top */}
        {[...facilities].reverse().filter(fac => fac.id !== selectedFacility?.id).concat(
          selectedFacility && facilities.find(f => f.id === selectedFacility.id) 
            ? [facilities.find(f => f.id === selectedFacility.id)!] 
            : []
        ).map(fac => {
          const isSelected = selectedFacility?.id === fac.id;
          return (
            <Marker 
              key={fac.id} 
              position={[fac.lat, fac.lng]}
              icon={getCategoryIcon(fac.category, fac.has_food, fac.has_washroom, fac.has_water, fac.has_charging, isSelected)}
              eventHandlers={{
                click: () => onSelectFacility(fac),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
