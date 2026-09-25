import React from 'react';
import { 
  CheckCircle, AlertTriangle, HelpCircle, MapPin, 
  Droplet, BatteryCharging, Shield, Coffee, Bookmark, 
  ExternalLink, Clock, Navigation
} from 'lucide-react';
import { Facility } from '../types';

interface FacilityCardProps {
  facility: Facility;
  onSelect: (facility: Facility) => void;
  onBookmarkToggle?: (facilityId: number) => void;
  onReportClick?: (facility: Facility) => void;
  highlightReason?: string;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onSelect,
  onBookmarkToggle,
  onReportClick,
  highlightReason
}) => {
  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const getVerificationBadge = () => {
    switch (facility.verification_status) {
      case 'VERIFIED':
        return (
          <span className="badge badge-verified" title="Verified by Restora community">
            <CheckCircle size={12} /> Verified
          </span>
        );
      case 'RECENTLY_REPORTED':
        return (
          <span className="badge badge-reported" title="Recently reported with issues">
            <AlertTriangle size={12} /> Needs Check
          </span>
        );
      case 'ACCESS_UNKNOWN':
      case 'UNVERIFIED':
      default:
        return (
          <span className="badge badge-neutral" title="Unverified community submission">
            <HelpCircle size={12} /> Unverified
          </span>
        );
    }
  };

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              color: 'var(--primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.04em' 
            }}>
              {facility.category.replace('_', ' ')}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>•</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {facility.zone}
            </span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
            {facility.name}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {getVerificationBadge()}
          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle(facility.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: facility.is_bookmarked ? 'var(--primary)' : 'var(--text-muted)',
                padding: 4
              }}
              title={facility.is_bookmarked ? 'Remove Bookmark' : 'Bookmark Facility'}
            >
              <Bookmark size={18} fill={facility.is_bookmarked ? 'var(--primary)' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Explanatory Highlight banner if provided */}
      {highlightReason && (
        <div style={{
          backgroundColor: 'var(--primary-light)',
          borderLeft: '3px solid var(--primary)',
          padding: '6px 10px',
          borderRadius: '0 6px 6px 0',
          fontSize: 12,
          color: 'var(--primary-dark)',
          fontWeight: 600
        }}>
          💡 {highlightReason}
        </div>
      )}

      {/* Address & Operational Info */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {facility.address}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 12 }}>{facility.operating_hours}</span>
          </div>

          {facility.distance_meters !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--primary)' }}>
              <Navigation size={14} />
              <span style={{ fontSize: 12 }}>{formatDistance(facility.distance_meters)}</span>
            </div>
          )}

          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
            {facility.access_type}
          </span>
        </div>
      </div>

      {/* Amenities Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
        {facility.has_rest && (
          <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
            🪑 Rest Bench
          </span>
        )}
        {facility.has_water && (
          <span className="badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
            💧 Free Water
          </span>
        )}
        {facility.has_washroom && (
          <span className="badge" style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}>
            🚻 Washroom
          </span>
        )}
        {facility.has_charging && (
          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
            ⚡ Mobile/EV Charge
          </span>
        )}
        {facility.has_shade && (
          <span className="badge" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
            ⛱️ Tree Shade
          </span>
        )}
        {facility.has_parking && (
          <span className="badge" style={{ backgroundColor: '#F5F3FF', color: '#6D28D9' }}>
            🅿️ Two-Wheeler Parking
          </span>
        )}
        {facility.has_food && (
          <span className="badge" style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}>
            ☕ Tea & Snacks
          </span>
        )}
        {facility.has_medical && (
          <span className="badge" style={{ backgroundColor: '#FEF2F2', color: '#B91C1C' }}>
            🩹 First-Aid
          </span>
        )}
      </div>

      {/* Card Actions Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border)',
        paddingTop: 10,
        marginTop: 6
      }}>
        <button
          onClick={() => onSelect(facility)}
          className="btn btn-primary btn-sm"
        >
          View Details & Status
        </button>

        {onReportClick && (
          <button
            onClick={() => onReportClick(facility)}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Report Issue
          </button>
        )}
      </div>
    </div>
  );
};
