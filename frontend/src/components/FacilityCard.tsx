import React from 'react';
import { 
  CheckCircle, AlertTriangle, HelpCircle, Bookmark
} from 'lucide-react';
import { Facility } from '../types';

interface FacilityCardProps {
  facility: Facility;
  onSelect: (facility: Facility) => void;
  onBookmarkToggle?: (facilityId: number) => void;
  onReportClick?: (facility: Facility) => void;
  highlightReason?: string;
  userLat?: number | null;
  userLng?: number | null;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onSelect,
  onBookmarkToggle
}) => {
  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) {
      return `${Math.round(meters)} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
  };

  // Honest Quality & Verification Badge
  const getVerificationBadge = () => {
    switch (facility.verification_status) {
      case 'VERIFIED':
        return (
          <span 
            className="badge badge-verified" 
            title="Officially verified by Restora coordinators or multiple workers"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <CheckCircle size={12} /> Verified ({facility.verification_count})
          </span>
        );
      case 'RECENTLY_REPORTED':
        return (
          <span 
            className="badge badge-reported" 
            title="Condition reported with issues by community. Needs check."
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <AlertTriangle size={12} /> Needs Check
          </span>
        );
      case 'ACCESS_UNKNOWN':
      case 'UNVERIFIED':
      default:
        return (
          <span 
            className="badge badge-neutral" 
            title="Unverified community submission"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <HelpCircle size={12} /> Unverified
          </span>
        );
    }
  };

  // Honest Availability Status (Issue #5 § 7)
  const getAvailabilityStatus = () => {
    if (!facility.is_open) {
      return {
        label: 'Temporarily Closed',
        color: '#EF4444',
        bg: '#FEF2F2',
        border: '#FCA5A5'
      };
    }

    if (facility.verification_status === 'RECENTLY_REPORTED') {
      return {
        label: 'Limited / Issue Reported',
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A'
      };
    }

    if (facility.verification_status === 'VERIFIED') {
      return {
        label: 'Available — recently reported',
        color: '#059669',
        bg: '#ECFDF5',
        border: '#A7F3D0'
      };
    }

    return {
      label: 'Availability unknown',
      color: '#64748B',
      bg: '#F8FAFC',
      border: '#E2E8F0'
    };
  };

  // Rest Suitability Classification (Issue #5 § 10)
  const getRestSuitability = () => {
    if (facility.has_rest && facility.has_shade && (facility.has_water || facility.has_washroom)) {
      return { text: 'Dedicated Rest Hub', color: '#059669', icon: '🌳' };
    }
    if (facility.has_rest || facility.has_shade) {
      return { text: 'Suitable for Short Break', color: '#2563EB', icon: '🪑' };
    }
    if (facility.has_water || facility.has_washroom || facility.has_charging) {
      return { text: 'Basic Facility Only', color: '#D97706', icon: '⚡' };
    }
    return { text: 'Rest Suitability Unknown', color: '#64748B', icon: 'ℹ️' };
  };

  const avail = getAvailabilityStatus();
  const suitability = getRestSuitability();

  // Relative last reported calculation
  const getRelativeReportedTime = (timestamp?: string) => {
    if (!timestamp) return 'No recent reports';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `Reported ${Math.max(1, diffMins)}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Reported ${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `Reported ${diffDays}d ago`;
    } catch {
      return 'Recently reported';
    }
  };

  return (
    <div 
      className="card card-hover" 
      onClick={() => onSelect(facility)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10,
        cursor: 'pointer',
        padding: '14px 16px',
        borderRadius: 14,
        border: '1px solid var(--border)'
      }}
    >
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
            {facility.distance_meters !== undefined && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>•</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>
                  {formatDistance(facility.distance_meters)}
                </span>
              </>
            )}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
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

      {/* Honest Availability & Suitability Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: avail.color,
          backgroundColor: avail.bg,
          border: `1px solid ${avail.border}`,
          padding: '2px 8px',
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: avail.color }}></span>
          {avail.label}
        </span>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>{suitability.icon}</span>
          <span>{suitability.text}</span>
        </span>
      </div>

      {/* Amenity Icons Row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {facility.has_washroom && (
          <span className="amenity-chip" title="Clean Washroom">
            🚻 Washroom
          </span>
        )}
        {facility.has_water && (
          <span className="amenity-chip" title="Free Drinking Water">
            💧 Water
          </span>
        )}
        {facility.has_charging && (
          <span className="amenity-chip" title="Device/EV Charging">
            🔋 Charging
          </span>
        )}
        {facility.has_rest && (
          <span className="amenity-chip" title="Seated Rest Area">
            🌳 Seating
          </span>
        )}
        {facility.has_shade && (
          <span className="amenity-chip" title="Canopy Shade">
            ⛱️ Shade
          </span>
        )}
        {facility.has_food && (
          <span className="amenity-chip" title="Subsidized Food">
            🍱 Food
          </span>
        )}
      </div>

      {/* Footer Metadata */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingTop: 6, 
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-muted)'
      }}>
        <span>🕒 {facility.operating_hours || 'Hours not listed'}</span>
        <span>{getRelativeReportedTime(facility.last_reported_at)}</span>
      </div>
    </div>
  );
};
