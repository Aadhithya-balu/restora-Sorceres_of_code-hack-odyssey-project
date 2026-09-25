import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Facility } from '../types';

interface InteractiveMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  userLat?: number;
  userLng?: number;
  height?: string | number;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  userLat = 11.0267,
  userLng = 77.0118,
  height = '420px'
}) => {
  const [mapType, setMapType] = useState<'standard' | 'transit'>('standard');

  // Map coordinates bounding box around Peelamedu / Coimbatore
  // Lat range: ~11.0100 to 11.0450 (South to North)
  // Lng range: ~76.9950 to 77.0350 (West to East)
  const minLat = 11.010;
  const maxLat = 11.045;
  const minLng = 76.995;
  const maxLng = 77.035;

  const latToY = (lat: number) => {
    const clamped = Math.max(minLat, Math.min(maxLat, lat));
    return 100 - ((clamped - minLat) / (maxLat - minLat)) * 100;
  };

  const lngToX = (lng: number) => {
    const clamped = Math.max(minLng, Math.min(maxLng, lng));
    return ((clamped - minLng) / (maxLng - minLng)) * 100;
  };

  const getPinColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#059669'; // Green
      case 'RECENTLY_REPORTED':
        return '#D97706'; // Amber
      default:
        return '#2563EB'; // Blue
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: height,
      backgroundColor: '#F1F5F9',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* SVG Background Map Canvas */}
      <svg
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Subtle grid pattern */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Major Arterial Corridors in Peelamedu */}
        {/* Avinashi Road (Diagonal primary artery) */}
        <line x1="0" y1="75" x2="100" y2="25" stroke="#CBD5E1" strokeWidth="2.8" strokeLinecap="round" />
        <line x1="0" y1="75" x2="100" y2="25" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="1.5 1" strokeLinecap="round" />

        {/* Trichy Road / Ramanathapuram Bypass (Lower artery) */}
        <line x1="0" y1="92" x2="100" y2="82" stroke="#E2E8F0" strokeWidth="2.2" strokeLinecap="round" />

        {/* Hope College / Aerodrome cross arterial */}
        <line x1="55" y1="0" x2="45" y2="100" stroke="#CBD5E1" strokeWidth="2.0" strokeLinecap="round" />

        {/* TIDEL Park / IT Corridor branch */}
        <line x1="20" y1="65" x2="85" y2="15" stroke="#E2E8F0" strokeWidth="1.8" strokeDasharray="2 1" />

        {/* Coimbatore International Airport Runway Area */}
        <rect x="75" y="10" width="22" height="18" fill="#E2E8F0" opacity="0.5" rx="2" />
        <text x="78" y="20" fontSize="2" fill="#64748B" fontWeight="bold">Airport Zone</text>

        {/* PSG Tech / College Campus Green Zone */}
        <circle cx="35" cy="55" r="8" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.4" />
        <text x="30" y="56" fontSize="2" fill="#047857" fontWeight="bold">PSG Tech</text>

        {/* TIDEL Park Area */}
        <circle cx="65" cy="35" r="7" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="0.4" />
        <text x="59" y="36" fontSize="2" fill="#1D4ED8" fontWeight="bold">TIDEL Park</text>

        {/* Fun Republic Mall Area */}
        <text x="22" y="72" fontSize="2" fill="#64748B" fontWeight="600">Avinashi Rd</text>
        <text x="47" y="25" fontSize="2" fill="#64748B" fontWeight="600">Hope College Jn</text>

        {/* User GPS Location Radar Circle */}
        <circle
          cx={lngToX(userLng)}
          cy={latToY(userLat)}
          r="6"
          fill="rgba(13, 148, 136, 0.15)"
          stroke="#0D9488"
          strokeWidth="0.4"
        />
        <circle
          cx={lngToX(userLng)}
          cy={latToY(userLat)}
          r="1.8"
          fill="#0D9488"
          stroke="#FFFFFF"
          strokeWidth="0.6"
        />
      </svg>

      {/* Interactive HTML Markers for Facilities */}
      {facilities.map((fac) => {
        const left = lngToX(fac.lng);
        const top = latToY(fac.lat);
        const isSelected = selectedFacility?.id === fac.id;
        const color = getPinColor(fac.verification_status);

        return (
          <div
            key={fac.id}
            onClick={() => onSelectFacility(fac)}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              transform: 'translate(-50%, -100%)',
              cursor: 'pointer',
              zIndex: isSelected ? 30 : 10,
              transition: 'transform 0.15s ease-out'
            }}
            title={`${fac.name} (${fac.verification_status})`}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Badge tooltip if selected */}
              {isSelected && (
                <div style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  marginBottom: 3,
                  pointerEvents: 'none'
                }}>
                  {fac.name}
                </div>
              )}

              {/* Pin Icon Bubble */}
              <div style={{
                width: isSelected ? 32 : 26,
                height: isSelected ? 32 : 26,
                borderRadius: '50% 50% 50% 0',
                transform: 'rotate(-45deg)',
                backgroundColor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 0 3px #FFFFFF, 0 4px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.2)',
                border: '1.5px solid #FFFFFF',
                transition: 'all 0.15s'
              }}>
                <div style={{ transform: 'rotate(45deg)', color: '#FFFFFF', display: 'flex' }}>
                  {fac.verification_status === 'VERIFIED' ? (
                    <CheckCircle size={isSelected ? 16 : 13} />
                  ) : fac.verification_status === 'RECENTLY_REPORTED' ? (
                    <AlertTriangle size={isSelected ? 16 : 13} />
                  ) : (
                    <MapPin size={isSelected ? 16 : 13} />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Map Control Buttons */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 20
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <Compass size={13} color="var(--primary)" /> Peelamedu Zone
        </div>
      </div>

      {/* Legend Bar at Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 11,
        color: 'var(--text-secondary)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0D9488' }} />
          <span>You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669' }} />
          <span>Verified</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D97706' }} />
          <span>Reported</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563EB' }} />
          <span>Community</span>
        </div>
      </div>
    </div>
  );
};
