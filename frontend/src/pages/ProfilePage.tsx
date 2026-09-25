import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Mail, Phone, MapPin, Globe, 
  Bookmark, AlertTriangle, Coffee, Edit2, Check, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Facility, FacilityReport, BreakSession, WorkerCategory } from '../types';
import { breakApi, reportApi, authApi } from '../services/api';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityDetailModal } from '../components/FacilityDetailModal';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, refreshUser, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reports' | 'breaks'>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Facility[]>([]);
  const [reports, setReports] = useState<FacilityReport[]>([]);
  const [breaks, setBreaks] = useState<BreakSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<WorkerCategory>('delivery_rider');
  const [editLanguage, setEditLanguage] = useState('Tamil');
  const [editWorkArea, setEditWorkArea] = useState('Peelamedu, Coimbatore');
  const [editHourlyRate, setEditHourlyRate] = useState(120);
  const [savingProfile, setSavingProfile] = useState(false);

  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditCategory(user.worker_category);
      setEditLanguage(user.preferred_language);
      setEditWorkArea(user.work_area);
      setEditHourlyRate(user.hourly_rate_estimate || 120);
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!isAuthenticated || !user) return;
    try {
      setLoading(true);
      const [bmData, repData, brkData] = await Promise.all([
        breakApi.getBookmarks(),
        reportApi.getReports({ user_id: user.id }),
        breakApi.getBreaks()
      ]);
      setBookmarks(bmData.map(b => ({ ...b.facility, is_bookmarked: true })));
      setReports(repData);
      setBreaks(brkData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [isAuthenticated, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await authApi.updateProfile({
        name: editName.trim(),
        worker_category: editCategory,
        preferred_language: editLanguage,
        work_area: editWorkArea.trim(),
        hourly_rate_estimate: Number(editHourlyRate)
      });
      await refreshUser();
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Profile update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBookmarkToggle = async (facilityId: number) => {
    try {
      await breakApi.toggleBookmark(facilityId);
      loadProfileData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle bookmark');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="container page-container" style={{ textAlign: 'center', padding: '60px 16px' }}>
        <h2>Sign in to view your Restora Worker Profile</h2>
        <p style={{ marginTop: 8, marginBottom: 20 }}>
          Manage your rest bookmarks, crowdsourced reports, and income impact preferences.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary">
          Worker Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Card Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 800,
            border: '2px solid var(--primary-border)'
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22 }}>{user.name}</h1>
              <span className="badge badge-verified">
                {user.role === 'admin' ? 'Admin' : 'Verified Worker'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {user.email} • {user.worker_category.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span>📍 {user.work_area}</span>
              <span>🗣️ {user.preferred_language}</span>
              <span>💰 ₹{user.hourly_rate_estimate}/hr</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-secondary btn-sm"
        >
          <Edit2 size={13} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {/* Edit Profile Form if open */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 16 }}>Update Profile Details</h3>
          <div className="grid grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Worker Category</label>
              <select
                className="form-select"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as WorkerCategory)}
              >
                <option value="delivery_rider">🛵 Delivery Rider</option>
                <option value="cab_driver">🚕 Cab / Auto Driver</option>
                <option value="courier_worker">📦 Parcel Courier</option>
                <option value="logistics_worker">🚚 Logistics Worker</option>
                <option value="other">👷 Other Field Worker</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Language</label>
              <select
                className="form-select"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value)}
              >
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Operating Work Area</label>
              <input
                type="text"
                className="form-input"
                value={editWorkArea}
                onChange={(e) => setEditWorkArea(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Estimated Hourly Earnings (₹/hr)</label>
              <input
                type="number"
                min="50"
                max="500"
                className="form-input"
                value={editHourlyRate}
                onChange={(e) => setEditHourlyRate(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`btn ${activeTab === 'bookmarks' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Bookmark size={15} /> Bookmarked Rest Points ({bookmarks.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <AlertTriangle size={15} /> My Facility Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('breaks')}
          className={`btn ${activeTab === 'breaks' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Coffee size={15} /> My Rest Breaks ({breaks.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'bookmarks' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Loading bookmarks...
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              No facilities bookmarked yet. Browse the map and tap the bookmark icon on places you trust!
            </div>
          ) : (
            <div className="grid grid-3">
              {bookmarks.map((fac) => (
                <FacilityCard
                  key={fac.id}
                  facility={fac}
                  onSelect={(f) => setDetailFacility(f)}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              You haven't submitted any condition reports yet. Report broken taps or locked washrooms to help fellow gig workers!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((rep) => (
                <div key={rep.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className={`badge ${rep.status === 'APPROVED' ? 'badge-verified' : rep.status === 'REJECTED' ? 'badge-danger' : 'badge-pending'}`}>
                        {rep.status}
                      </span>
                      <strong>{rep.report_type.replace(/_/g, ' ')}</strong>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        • Facility #{rep.facility_id}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {rep.description}
                    </p>
                    {rep.review_notes && (
                      <div style={{ fontSize: 12, color: 'var(--primary-dark)', marginTop: 4, fontStyle: 'italic' }}>
                        Moderator note: {rep.review_notes}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(rep.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'breaks' && (
        <div>
          {breaks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              No break sessions logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {breaks.map((b) => (
                <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {b.planned_duration_minutes} min rest
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {b.facility_name || 'Roadside rest stop'} • {new Date(b.start_time).toLocaleString()}
                    </div>
                    {b.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Notes: {b.notes}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${b.status === 'COMPLETED' ? 'badge-verified' : 'badge-pending'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FacilityDetailModal
        facility={detailFacility}
        isOpen={!!detailFacility}
        onClose={() => setDetailFacility(null)}
        onOpenReport={() => {}}
        onBookmarkToggle={handleBookmarkToggle}
      />
    </div>
  );
};
