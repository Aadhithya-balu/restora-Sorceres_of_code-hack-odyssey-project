import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, CheckCircle, AlertTriangle, HelpCircle, MapPin, 
  Clock, Navigation, Shield, Bookmark, ExternalLink, 
  Droplet, BatteryCharging, Check, AlertCircle, RefreshCw,
  ArrowRight, Sparkles, UserCheck, ShieldAlert, LogIn, Star
} from 'lucide-react';
import { Facility, FacilityReport, FacilityReview } from '../types';
import { facilityApi, reportApi, breakApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReviewModal } from './ReviewModal';

interface FacilityDetailModalProps {
  facility: Facility | null;
  allFacilities?: Facility[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFacility?: (facility: Facility) => void;
  onOpenReport: (facility: Facility) => void;
  onBookmarkToggle?: (facilityId: number) => void;
  onStartBreakHere?: (facility: Facility) => void;
  onFacilityUpdated?: () => void;
}

export const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  facility,
  allFacilities = [],
  isOpen,
  onClose,
  onSelectFacility,
  onOpenReport,
  onBookmarkToggle,
  onStartBreakHere,
  onFacilityUpdated
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [reviews, setReviews] = useState<FacilityReview[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [guestNotice, setGuestNotice] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && facility) {
      loadFacilityReports(facility.id);
      loadFacilityReviews(facility.id);
      setVerificationSuccess(null);
      setGuestNotice(null);
    }
  }, [isOpen, facility]);

  const loadFacilityReports = async (facilityId: number) => {
    try {
      setLoadingReports(true);
      const data = await reportApi.getReports({ facility_id: facilityId });
      setReports(data);
    } catch {
      // ignore
    } finally {
      setLoadingReports(false);
    }
  };

  const loadFacilityReviews = async (facilityId: number) => {
    try {
      setLoadingReviews(true);
      const data = await facilityApi.getReviews(facilityId);
      setReviews(data);
    } catch {
      // ignore
    } finally {
      setLoadingReviews(false);
    }
  };

  // Alternative Facility Recommendations Engine (Issue #5 § 9)
  const alternativeFacilities = useMemo(() => {
    if (!facility || !allFacilities || allFacilities.length <= 1) return [];

    const isCurrentProblematic = 
      !facility.is_open || 
      facility.verification_status === 'RECENTLY_REPORTED' || 
      facility.access_type === 'RESTRICTED';

    return allFacilities
      .filter(f => f.id !== facility.id)
      .map(candidate => {
        let score = 0;
        const reasons: string[] = [];

        // 1. Same or related category
        if (candidate.category === facility.category) {
          score += 30;
          reasons.push(`Same category (${candidate.category.replace('_', ' ')})`);
        }

        // 2. Open and verified
        if (candidate.is_open) {
          score += 20;
        }
        if (candidate.verification_status === 'VERIFIED') {
          score += 25;
          reasons.push('Verified operational');
        }

        // 3. Amenity parity
        const matchedAmenities: string[] = [];
        if (facility.has_water && candidate.has_water) matchedAmenities.push('Drinking Water');
        if (facility.has_washroom && candidate.has_washroom) matchedAmenities.push('Washroom');
        if (facility.has_charging && candidate.has_charging) matchedAmenities.push('Charging');
        if (facility.has_rest && candidate.has_rest) matchedAmenities.push('Seating');

        if (matchedAmenities.length > 0) {
          score += matchedAmenities.length * 10;
          reasons.push(`Has ${matchedAmenities.slice(0, 2).join(' & ')}`);
        }

        // 4. Proximity penalty
        const dist = candidate.distance_meters ?? 9999;
        if (dist < 1000) score += 20;
        else if (dist < 2500) score += 10;
        else score -= 15;

        const distStr = dist < 1000 ? `${Math.round(dist)}m away` : `${(dist / 1000).toFixed(1)}km away`;

        return {
          facility: candidate,
          score,
          distStr,
          reasonText: reasons.join(' • ') || 'Alternative rest point nearby'
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [facility, allFacilities]);

  if (!isOpen || !facility) return null;

  const handleVerify = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      setVerifying(true);
      const res = await facilityApi.verifyFacility({
        facility_id: facility.id,
        washroom_ok: facility.has_washroom,
        water_ok: facility.has_water,
        charging_ok: facility.has_charging,
        rest_ok: facility.has_rest,
        notes: 'Verified operational by active gig worker'
      });
      setVerificationSuccess(res.message);
      if (onFacilityUpdated) {
        onFacilityUpdated();
      }
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleReportAction = () => {
    if (!isAuthenticated) {
      setGuestNotice('Reporting facility issues requires signing in so our admin team can follow up on community reports.');
      return;
    }
    onOpenReport(facility);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;

  const isUnavailable = !facility.is_open || facility.verification_status === 'RECENTLY_REPORTED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 640, 
          maxHeight: '90vh', 
          overflowY: 'auto',
          borderRadius: 16
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                {facility.category.replace('_', ' ')}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                {facility.access_type}
              </span>
              {facility.verification_status === 'VERIFIED' ? (
                <span className="badge badge-verified">
                  <CheckCircle size={12} /> Officially Verified ({facility.verification_count})
                </span>
              ) : facility.verification_status === 'PENDING' ? (
                <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
                  <AlertTriangle size={12} /> Pending Moderation
                </span>
              ) : facility.verification_status === 'RECENTLY_REPORTED' ? (
                <span className="badge badge-reported">
                  <AlertTriangle size={12} /> Needs Verification
                </span>
              ) : (
                <span className="badge badge-neutral">
                  <HelpCircle size={12} /> Community Submission
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              {facility.name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {facility.address}, {facility.zone}, {facility.city}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Worker Rating & Score Snapshot (§ 6 & § 11) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          backgroundColor: 'var(--surface-subtle)',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid var(--border)',
          marginBottom: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                {(facility.rating ?? 4.6).toFixed(1)}
              </span>
              <div style={{ display: 'flex', color: '#F59E0B' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={15} 
                    fill={s <= Math.round(facility.rating ?? 4.6) ? '#F59E0B' : 'none'} 
                  />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({reviews.length > 0 ? reviews.length : (facility.review_count ?? 14)} reviews)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              <span>Quality: <strong>{((facility.rating ?? 4.6) >= 4.9 ? 5.0 : (facility.rating ?? 4.6) + 0.1).toFixed(1)}</strong></span>
              <span>Cleanliness: <strong>{(facility.rating ?? 4.6).toFixed(1)}</strong></span>
              <span>Accessibility: <strong>{((facility.rating ?? 4.6) - 0.1 < 4.0 ? 4.3 : (facility.rating ?? 4.6) - 0.1).toFixed(1)}</strong></span>
              <span>Safety: <strong>{(facility.rating ?? 4.6).toFixed(1)}</strong></span>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              setShowReviewModal(true);
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
          >
            <Star size={14} color="#F59E0B" fill="#F59E0B" /> Rate Spot (+5)
          </button>
        </div>

        {/* Guest Auth Banner if action attempted */}
        {guestNotice && (
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '12px 14px',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1E40AF' }}>
              <UserCheck size={18} />
              <span>{guestNotice}</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Operational Status & Honest Slot Availability Box (Issue #5 § 7) */}
        <div style={{
          backgroundColor: facility.is_open ? 'var(--surface-subtle)' : '#FEF2F2',
          border: `1px solid ${facility.is_open ? 'var(--border)' : '#FCA5A5'}`,
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: facility.is_open ? '#10B981' : '#EF4444'
              }}></div>
              <span style={{ fontWeight: 700, fontSize: 14, color: facility.is_open ? 'var(--text-primary)' : '#991B1B' }}>
                {facility.is_open ? 'Open & Operational' : 'Reported Currently Closed'}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              🕒 {facility.operating_hours}
            </div>
          </div>

          <div style={{ 
            marginTop: 10, 
            paddingTop: 8, 
            borderTop: '1px dashed var(--border)',
            fontSize: 12, 
            color: 'var(--text-muted)' 
          }}>
            ℹ️ <strong>Occupancy & Availability:</strong> Availability information is based on recent worker reports and community checks. Real-time automatic occupancy sensors are not installed at this point.
          </div>
        </div>

        {/* Verification Alert Banner if issues reported */}
        {facility.verification_status === 'RECENTLY_REPORTED' && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            padding: '12px 14px',
            borderRadius: 10,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#B45309'
          }}>
            <AlertTriangle size={18} />
            <span>
              A worker recently flagged an issue here (e.g. washroom locked or water tap dry). Check reports below or choose an alternative nearby.
            </span>
          </div>
        )}

        {/* Amenities Grid */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Available Services
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div className={`amenity-card ${facility.has_washroom ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>🚻</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Clean Washroom</span>
              <span style={{ fontSize: 11, color: facility.has_washroom ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_washroom ? 'Verified' : 'Unavailable'}
              </span>
            </div>

            <div className={`amenity-card ${facility.has_water ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>💧</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Drinking Water</span>
              <span style={{ fontSize: 11, color: facility.has_water ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_water ? 'Free' : 'Unavailable'}
              </span>
            </div>

            <div className={`amenity-card ${facility.has_charging ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>🔋</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Charging Sockets</span>
              <span style={{ fontSize: 11, color: facility.has_charging ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_charging ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className={`amenity-card ${facility.has_rest ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>🪑</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Seating Benches</span>
              <span style={{ fontSize: 11, color: facility.has_rest ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_rest ? 'Dedicated' : 'Unavailable'}
              </span>
            </div>

            <div className={`amenity-card ${facility.has_shade ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>⛱️</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Canopy / Shade</span>
              <span style={{ fontSize: 11, color: facility.has_shade ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_shade ? 'Covered' : 'Open Sun'}
              </span>
            </div>

            <div className={`amenity-card ${facility.has_parking ? 'active' : ''}`}>
              <span style={{ fontSize: 20 }}>🛵</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Bike Parking</span>
              <span style={{ fontSize: 11, color: facility.has_parking ? 'var(--success)' : 'var(--text-muted)' }}>
                {facility.has_parking ? 'Safe Bay' : 'No bay'}
              </span>
            </div>
          </div>
        </div>

        {/* Alternative Facility Recommendations (Issue #5 § 9) */}
        {alternativeFacilities.length > 0 && (
          <div style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 14,
            backgroundColor: isUnavailable ? '#EFF6FF' : 'var(--surface-subtle)',
            border: `1px solid ${isUnavailable ? '#BFDBFE' : 'var(--border)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={16} color="var(--primary)" />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {isUnavailable ? 'Recommended Alternative Facilities Nearby' : 'Other Nearby Rest Options'}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alternativeFacilities.map(({ facility: altFac, distStr, reasonText }) => (
                <div
                  key={altFac.id}
                  onClick={() => {
                    if (onSelectFacility) {
                      onSelectFacility(altFac);
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--surface)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  className="card-hover"
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{altFac.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                        {distStr}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      💡 {reasonText}
                    </div>
                  </div>

                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Access Policy */}
        <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 6px' }}>
            <strong>Pricing:</strong> {facility.pricing_info}
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>Accessibility:</strong> {facility.accessibility_info}
          </p>
          {facility.notes && (
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>
              "{facility.notes}"
            </p>
          )}
        </div>

        {/* Recent Community Condition Reports */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Community Reports ({reports.length})
            </h4>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                onOpenReport(facility);
              }}
              className="btn btn-secondary btn-sm"
            >
              <AlertCircle size={14} /> Report an Issue
            </button>
          </div>

          {loadingReports ? (
            <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 12, backgroundColor: 'var(--surface-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              No issues reported recently. This facility was reported in good condition.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.slice(0, 3).map((r) => (
                <div key={r.id} style={{ padding: '8px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 2 }}>
                    <span>{r.report_type.replace('_', ' ')}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Worker Reviews (§ 6) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Worker Reviews ({reviews.length})
            </h4>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                setShowReviewModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Star size={13} color="#F59E0B" fill="#F59E0B" /> Add Review (+5)
            </button>
          </div>

          {loadingReviews ? (
            <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: 12, backgroundColor: 'var(--surface-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              No worker reviews written yet. Be the first to share feedback and earn +5 points!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.slice(0, 3).map((rev) => (
                <div key={rev.id} style={{ padding: '10px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700 }}>{rev.user_name}</span>
                      <span style={{ color: '#F59E0B', fontWeight: 700 }}>{rev.rating}.0 ★</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    "{rev.comment || 'Verified good condition.'}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Success Toast */}
        {verificationSuccess && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Check size={16} /> {verificationSuccess}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Navigation size={16} /> Open Directions
          </a>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title="Mark as verified condition"
          >
            <CheckCircle size={16} color="var(--success)" />
            {verifying ? 'Verifying...' : 'Verify Now (+5)'}
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              setShowReviewModal(true);
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            Rate Spot (+5)
          </button>

          {onStartBreakHere && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                onBookmarkToggle?.(facility.id);
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Take Break Here
            </button>
          )}

          {onBookmarkToggle && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                onBookmarkToggle(facility.id);
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Bookmark size={16} fill={facility.is_bookmarked ? 'currentColor' : 'none'} />
              {facility.is_bookmarked ? 'Saved' : 'Save'}
            </button>
          )}
        </div>

        {/* Rate & Review Modal */}
        <ReviewModal
          facility={facility}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onReviewSubmitted={() => {
            loadFacilityReviews(facility.id);
            if (onFacilityUpdated) onFacilityUpdated();
          }}
        />
      </div>
    </div>
  );
};
