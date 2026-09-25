import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle, AlertTriangle, HelpCircle, MapPin, 
  Clock, Navigation, Shield, Bookmark, ExternalLink, 
  Droplet, BatteryCharging, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { Facility, FacilityReport } from '../types';
import { facilityApi, reportApi, breakApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FacilityDetailModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: (facility: Facility) => void;
  onBookmarkToggle?: (facilityId: number) => void;
  onStartBreakHere?: (facility: Facility) => void;
  onFacilityUpdated?: () => void;
}

export const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  facility,
  isOpen,
  onClose,
  onOpenReport,
  onBookmarkToggle,
  onStartBreakHere,
  onFacilityUpdated
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && facility) {
      loadFacilityReports(facility.id);
      setVerificationSuccess(null);
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

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                {facility.category.replace('_', ' ')}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                {facility.access_type}
              </span>
              {facility.verification_status === 'VERIFIED' ? (
                <span className="badge badge-verified">
                  <CheckCircle size={12} /> Verified ({facility.verification_count})
                </span>
              ) : facility.verification_status === 'RECENTLY_REPORTED' ? (
                <span className="badge badge-reported">
                  <AlertTriangle size={12} /> Needs Verification
                </span>
              ) : (
                <span className="badge badge-neutral">
                  <HelpCircle size={12} /> Unverified
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 20, marginTop: 8 }}>{facility.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {facility.address}, {facility.zone}, {facility.city}
            </p>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Quick Navigation / Directions Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--surface-subtle)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Clock size={15} color="var(--primary)" />
              <strong>{facility.operating_hours}</strong>
            </div>
            {facility.distance_meters !== undefined && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                • {facility.distance_meters < 1000 ? `${Math.round(facility.distance_meters)} m` : `${(facility.distance_meters/1000).toFixed(1)} km`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Navigation size={13} /> Maps Route <ExternalLink size={11} />
            </a>

            {onBookmarkToggle && (
              <button
                onClick={() => onBookmarkToggle(facility.id)}
                className="btn btn-secondary btn-sm"
                title="Bookmark"
              >
                <Bookmark 
                  size={14} 
                  fill={facility.is_bookmarked ? 'var(--primary)' : 'none'} 
                  color={facility.is_bookmarked ? 'var(--primary)' : 'currentColor'} 
                />
              </button>
            )}
          </div>
        </div>

        {/* Access and Pricing Info */}
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 16,
          fontSize: 13
        }}>
          <div style={{ marginBottom: 6 }}>
            <strong>Pricing & Access Terms: </strong>
            <span style={{ color: 'var(--text-secondary)' }}>{facility.pricing_info || 'Free for all riders'}</span>
          </div>
          <div>
            <strong>Accessibility / Parking: </strong>
            <span style={{ color: 'var(--text-secondary)' }}>{facility.accessibility_info || 'Standard ground-floor entry'}</span>
          </div>
          {facility.notes && (
            <div style={{ marginTop: 6, fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Note: {facility.notes}
            </div>
          )}
        </div>

        {/* Amenities Checklist */}
        <h4 style={{ fontSize: 14, marginBottom: 8 }}>Available Amenities</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_rest ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_rest ? '✔' : '✖'}
            </span>
            <span>Resting Benches / Seating</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_water ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_water ? '✔' : '✖'}
            </span>
            <span>Clean Drinking Water</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_washroom ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_washroom ? '✔' : '✖'}
            </span>
            <span>Washroom Facilities</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_charging ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_charging ? '✔' : '✖'}
            </span>
            <span>Phone / EV Charging</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_shade ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_shade ? '✔' : '✖'}
            </span>
            <span>Sun & Rain Canopy Shade</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_parking ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_parking ? '✔' : '✖'}
            </span>
            <span>Dedicated Bike Parking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_food ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_food ? '✔' : '✖'}
            </span>
            <span>Affordable Food / Tea</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: facility.has_medical ? 'var(--success)' : 'var(--text-muted)' }}>
              {facility.has_medical ? '✔' : '✖'}
            </span>
            <span>First Aid & Medical Kit</span>
          </div>
        </div>

        {/* Worker Verification Box */}
        <div style={{
          border: '1px dashed var(--primary-border)',
          backgroundColor: 'var(--primary-light)',
          padding: 14,
          borderRadius: 'var(--radius-md)',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)' }}>
                Are you currently at this rest point?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Confirm these facilities are accessible right now to help other workers.
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying}
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {verifying ? 'Verifying...' : (
                <>
                  <Check size={14} /> Verify Facility (Working)
                </>
              )}
            </button>
          </div>

          {verificationSuccess && (
            <div style={{
              marginTop: 10,
              padding: '6px 10px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              fontWeight: 600
            }}>
              ✓ {verificationSuccess}
            </div>
          )}
        </div>

        {/* Recent Crowd Reports */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14 }}>Recent Community Reports ({reports.length})</h4>
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
              <AlertTriangle size={13} color="var(--warning)" /> Report An Issue
            </button>
          </div>

          {loadingReports ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
              Loading condition history...
            </div>
          ) : reports.length === 0 ? (
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-md)'
            }}>
              No active issues reported. This facility is in good standing!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
              {reports.map((report) => (
                <div 
                  key={report.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: report.status === 'APPROVED' ? 'var(--warning-bg)' : 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    fontSize: 12
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <strong>{report.report_type.replace(/_/g, ' ')}</strong>
                    <span className={`badge ${report.status === 'APPROVED' ? 'badge-reported' : 'badge-neutral'}`} style={{ fontSize: 9 }}>
                      {report.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{report.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    By {report.user_name} • {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {onStartBreakHere ? (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                onStartBreakHere(facility);
                onClose();
              }}
              className="btn btn-outline"
            >
              Take Rest Break Here
            </button>
          ) : <div />}

          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
