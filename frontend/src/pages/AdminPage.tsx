import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, AlertTriangle, Trash2, PlusCircle, 
  MapPin, Clock, Users, Coffee, ExternalLink, Activity, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminOverview, Facility, FacilityReport } from '../types';
import { adminApi, facilityApi, reportApi } from '../services/api';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, openAuthModal } = useAuth();

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [activeTab, setActiveTab] = useState<'moderation' | 'facilities' | 'gaps'>('moderation');
  const [loading, setLoading] = useState(false);

  // New facility form state
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [newFacName, setNewFacName] = useState('');
  const [newFacCategory, setNewFacCategory] = useState('PETROL_PUMP');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacZone, setNewFacZone] = useState('Peelamedu');
  const [newFacCity, setNewFacCity] = useState('Coimbatore');
  const [newFacLat, setNewFacLat] = useState(11.0267);
  const [newFacLng, setNewFacLng] = useState(77.0118);
  const [newFacHours, setNewFacHours] = useState('24 Hours');
  const [newFacAccess, setNewFacAccess] = useState<'PUBLIC' | 'PRIVATE' | 'PERMISSION_REQUIRED'>('PUBLIC');
  const [newFacPricing, setNewFacPricing] = useState('Free for gig delivery workers');
  const [newFacWater, setNewFacWater] = useState(true);
  const [newFacWashroom, setNewFacWashroom] = useState(true);
  const [newFacCharging, setNewFacCharging] = useState(true);
  const [newFacRest, setNewFacRest] = useState(true);
  const [newFacShade, setNewFacShade] = useState(true);
  const [newFacParking, setNewFacParking] = useState(true);
  const [newFacFood, setNewFacFood] = useState(false);
  const [newFacMedical, setNewFacMedical] = useState(false);
  const [submittingFac, setSubmittingFac] = useState(false);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const [ov, facs, reps] = await Promise.all([
        adminApi.getOverview(),
        facilityApi.getFacilities(),
        reportApi.getReports()
      ]);
      setOverview(ov);
      setFacilities(facs);
      setReports(reps);
    } catch (err: any) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  const handleModerateReport = async (reportId: number, status: string) => {
    const review_notes = prompt(`Add moderator note for this action (${status}):`, 'Verified by Restora administrator');
    if (review_notes === null) return;

    try {
      await reportApi.moderateReport(reportId, {
        status,
        review_notes: review_notes.trim() || undefined
      });
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate report');
    }
  };

  const handleDeleteFacility = async (facId: number, facName: string) => {
    if (!confirm(`Are you sure you want to delete facility "${facName}"?`)) return;
    try {
      await facilityApi.deleteFacility(facId);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete facility');
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFac(true);
      await facilityApi.createFacility({
        name: newFacName.trim(),
        category: newFacCategory,
        address: newFacAddress.trim(),
        zone: newFacZone.trim(),
        city: newFacCity.trim(),
        lat: Number(newFacLat),
        lng: Number(newFacLng),
        operating_hours: newFacHours.trim(),
        access_type: newFacAccess,
        pricing_info: newFacPricing.trim(),
        has_water: newFacWater,
        has_washroom: newFacWashroom,
        has_charging: newFacCharging,
        has_rest: newFacRest,
        has_shade: newFacShade,
        has_parking: newFacParking,
        has_food: newFacFood,
        has_medical: newFacMedical,
        verification_status: 'VERIFIED'
      });
      setIsAddingFacility(false);
      // Reset form
      setNewFacName('');
      setNewFacAddress('');
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to create facility');
    } finally {
      setSubmittingFac(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container page-container" style={{ textAlign: 'center', padding: '60px 16px' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Shield size={28} />
        </div>
        <h2 style={{ fontSize: 22 }}>Admin Authorization Required</h2>
        <p style={{ marginTop: 8, marginBottom: 20, color: 'var(--text-secondary)' }}>
          You must be signed in with an administrative account to access Restora facility moderation and gap analytics.
        </p>
        <button 
          onClick={() => openAuthModal('login')} 
          className="btn btn-primary"
        >
          Sign In with Admin Credentials
        </button>
      </div>
    );
  }

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={24} color="var(--primary)" />
            <h1 style={{ fontSize: 24 }}>Platform Administration & Moderation</h1>
          </div>
          <p style={{ fontSize: 14 }}>
            Manage rest facilities, verify crowdsourced condition updates, and identify urban corridor service gaps.
          </p>
        </div>

        <button
          onClick={() => setIsAddingFacility(true)}
          className="btn btn-primary"
        >
          <PlusCircle size={16} /> Add Rest Point
        </button>
      </div>

      {/* Metrics Banner */}
      {overview && (
        <div className="grid grid-4">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Facilities</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{overview.total_facilities}</div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>
              ✓ {overview.verified_facilities} Verified
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Crowd Reports</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{overview.total_reports}</div>
            <div style={{ fontSize: 12, color: overview.pending_reports > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: 2 }}>
              ⚠️ {overview.pending_reports} Pending Review
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Breaks Logged</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{overview.total_break_sessions}</div>
            <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>
              ☕ Worker Respite
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Platform Users</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{overview.total_users}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
              🛵 Active Workforce
            </div>
          </div>
        </div>
      )}

      {/* Create Facility Modal */}
      {isAddingFacility && (
        <div className="modal-overlay" onClick={() => setIsAddingFacility(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>Register New Rest Point</h3>
            <form onSubmit={handleCreateFacility} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Facility Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="E.g., Bharat Petroleum Gig Rest Stop"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                />
              </div>

              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newFacCategory}
                    onChange={(e) => setNewFacCategory(e.target.value)}
                  >
                    <option value="PETROL_PUMP">Petrol Pump</option>
                    <option value="PUBLIC_REST_POINT">Public Rest Point</option>
                    <option value="PARTNER_CAFE">Partner Cafe</option>
                    <option value="TRANSIT_STATION">Transit Station</option>
                    <option value="EV_CHARGING_HUB">EV Charging Hub</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Access Policy</label>
                  <select
                    className="form-select"
                    value={newFacAccess}
                    onChange={(e) => setNewFacAccess(e.target.value as any)}
                  >
                    <option value="PUBLIC">Public Access</option>
                    <option value="PERMISSION_REQUIRED">Permission Required</option>
                    <option value="PRIVATE">Private / Partner</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Address *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="E.g., Avinashi Road, Near PSG Tech"
                  value={newFacAddress}
                  onChange={(e) => setNewFacAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Operating Hours</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFacHours}
                    onChange={(e) => setNewFacHours(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pricing Terms</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newFacPricing}
                    onChange={(e) => setNewFacPricing(e.target.value)}
                  />
                </div>
              </div>

              {/* Amenity Checkboxes */}
              <div>
                <label className="form-label">Available Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                  <label><input type="checkbox" checked={newFacWater} onChange={(e) => setNewFacWater(e.target.checked)} /> 💧 Clean Water</label>
                  <label><input type="checkbox" checked={newFacWashroom} onChange={(e) => setNewFacWashroom(e.target.checked)} /> 🚻 Washroom</label>
                  <label><input type="checkbox" checked={newFacCharging} onChange={(e) => setNewFacCharging(e.target.checked)} /> ⚡ Charging Point</label>
                  <label><input type="checkbox" checked={newFacRest} onChange={(e) => setNewFacRest(e.target.checked)} /> 🪑 Rest Benches</label>
                  <label><input type="checkbox" checked={newFacShade} onChange={(e) => setNewFacShade(e.target.checked)} /> ⛱️ Shade Canopy</label>
                  <label><input type="checkbox" checked={newFacParking} onChange={(e) => setNewFacParking(e.target.checked)} /> 🅿️ Two-Wheeler Parking</label>
                  <label><input type="checkbox" checked={newFacFood} onChange={(e) => setNewFacFood(e.target.checked)} /> ☕ Food / Tea</label>
                  <label><input type="checkbox" checked={newFacMedical} onChange={(e) => setNewFacMedical(e.target.checked)} /> 🩹 First-Aid Box</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button type="button" onClick={() => setIsAddingFacility(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingFac}>
                  {submittingFac ? 'Saving...' : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`btn ${activeTab === 'moderation' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <AlertTriangle size={15} /> Crowd Reports Moderation ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('facilities')}
          className={`btn ${activeTab === 'facilities' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <MapPin size={15} /> Facility Directory ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('gaps')}
          className={`btn ${activeTab === 'gaps' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={15} /> Service Gap Analytics
        </button>
      </div>

      {/* Report Moderation Tab */}
      {activeTab === 'moderation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              No crowdsourced reports submitted yet.
            </div>
          ) : (
            reports.map((rep) => (
              <div 
                key={rep.id} 
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 14,
                  borderLeft: rep.status === 'PENDING' ? '4px solid var(--warning)' : '1px solid var(--border)'
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge ${rep.status === 'PENDING' ? 'badge-reported' : rep.status === 'APPROVED' ? 'badge-verified' : 'badge-danger'}`}>
                      {rep.status}
                    </span>
                    <strong>{rep.report_type.replace(/_/g, ' ')}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Facility #{rep.facility_id}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {rep.description}
                  </p>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Reported by <strong>{rep.user_name}</strong> on {new Date(rep.created_at).toLocaleString()}
                    {rep.review_notes && ` • Note: ${rep.review_notes}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {rep.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleModerateReport(rep.id, 'APPROVED')}
                        className="btn btn-primary btn-sm"
                      >
                        Approve (Update Facility)
                      </button>
                      <button
                        onClick={() => handleModerateReport(rep.id, 'REJECTED')}
                        className="btn btn-secondary btn-sm"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Moderated: {rep.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Facilities Management Tab */}
      {activeTab === 'facilities' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '2px solid var(--border)', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Zone</th>
                <th style={{ padding: '12px 16px' }}>Hours</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((fac) => (
                <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {fac.name}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{fac.address}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: 10 }}>{fac.category.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{fac.zone}</td>
                  <td style={{ padding: '12px 16px' }}>{fac.operating_hours}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${fac.verification_status === 'VERIFIED' ? 'badge-verified' : 'badge-reported'}`}>
                      {fac.verification_status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteFacility(fac.id, fac.name)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Facility"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Service Gap Analytics Tab */}
      {activeTab === 'gaps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Service gaps identify zones where gig workers face high delivery density but lack essential amenities such as shade, public washrooms, or EV chargers.
          </div>

          <div className="grid grid-2">
            {overview?.service_gaps.map((gap, idx) => (
              <div 
                key={idx} 
                className="card"
                style={{
                  borderLeft: `4px solid ${gap.severity === 'HIGH' ? '#EF4444' : gap.severity === 'MODERATE' ? '#F59E0B' : '#10B981'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16 }}>{gap.zone}</h3>
                  <span className={`badge ${gap.severity === 'HIGH' ? 'badge-danger' : gap.severity === 'MODERATE' ? 'badge-reported' : 'badge-verified'}`}>
                    {gap.severity} Priority
                  </span>
                </div>

                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  <strong>Current Rest Points:</strong> {gap.total_points}
                </div>

                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>Identified Gaps:</strong>
                  <ul style={{ paddingLeft: 18, marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {gap.identified_gaps.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
