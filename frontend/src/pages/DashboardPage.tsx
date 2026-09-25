import React, { useState, useEffect } from 'react';
import { 
  Droplet, BatteryCharging, Coffee, Shield, Compass, 
  MapPin, Clock, ArrowRight, Bookmark, AlertTriangle, 
  CheckCircle, PlusCircle, Activity, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Facility, RecommendationResult, BreakSession } from '../types';
import { recommendationApi, breakApi, facilityApi } from '../services/api';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityDetailModal } from '../components/FacilityDetailModal';
import { ReportModal } from '../components/ReportModal';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [activeNeed, setActiveNeed] = useState<string>('all');
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);
  const [recentBreaks, setRecentBreaks] = useState<BreakSession[]>([]);
  
  // Default coordinates: Peelamedu, Coimbatore
  const userLat = 11.0267;
  const userLng = 77.0118;

  const loadRecommendations = async (needFilter = 'all') => {
    try {
      setLoadingRecommendations(true);
      const params: any = {
        lat: userLat,
        lng: userLng,
        max_distance_meters: 5000
      };

      if (needFilter === 'water') params.need_water = true;
      if (needFilter === 'washroom') params.need_washroom = true;
      if (needFilter === 'charging') params.need_charging = true;
      if (needFilter === 'rest') params.need_rest = true;
      if (needFilter === 'shade') params.need_shade = true;
      if (needFilter === 'medical') params.need_medical = true;

      const res = await recommendationApi.getIntelligentRecommendations(params);
      setRecommendations(res.recommendations);
    } catch {
      // ignore
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadRecentBreaks = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await breakApi.getBreaks();
      setRecentBreaks(data.slice(0, 3));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRecommendations(activeNeed);
    loadRecentBreaks();
  }, [activeNeed, isAuthenticated]);

  const handleNeedClick = (needKey: string) => {
    const next = activeNeed === needKey ? 'all' : needKey;
    setActiveNeed(next);
  };

  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await breakApi.toggleBookmark(facilityId);
      // Update local state
      setRecommendations((prev) =>
        prev.map((r) =>
          r.facility.id === facilityId
            ? { ...r, facility: { ...r.facility, is_bookmarked: res.bookmarked } }
            : r
        )
      );
    } catch (err: any) {
      alert(err.message || 'Bookmark update failed');
    }
  };

  const handleQuickBreak = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      await breakApi.createBreak({
        planned_duration_minutes: 15,
        notes: 'Quick rest break logged from Dashboard'
      });
      loadRecentBreaks();
      onNavigate('breaks');
    } catch (err: any) {
      alert(err.message || 'Failed to start break');
    }
  };

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Worker Greeting & Current Status Header */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-verified">Active Shift</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {user ? (user.worker_category.replace('_', ' ').toUpperCase()) : 'GIG WORKER'}
            </span>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>
            Vanakkam, {user ? user.name : 'Rider'}! 🛵
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <MapPin size={14} color="var(--primary)" />
            <span>Currently near <strong>Peelamedu, Coimbatore</strong> (GPS synced)</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={handleQuickBreak}
            className="btn btn-outline"
            style={{ fontWeight: 700 }}
          >
            <Coffee size={16} /> Take 15m Break
          </button>
          <button 
            onClick={() => onNavigate('route')}
            className="btn btn-primary"
          >
            <Compass size={16} /> Route Corridor Check
          </button>
        </div>
      </div>

      {/* Quick Need Action Buttons */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>What do you need right now?</h2>
          {activeNeed !== 'all' && (
            <button 
              onClick={() => setActiveNeed('all')} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Filter
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12
        }}>
          <button
            onClick={() => handleNeedClick('water')}
            className="card card-hover"
            style={{
              padding: '14px',
              textAlign: 'center',
              backgroundColor: activeNeed === 'water' ? 'var(--primary-light)' : 'var(--surface)',
              borderColor: activeNeed === 'water' ? 'var(--primary)' : 'var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>💧</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: activeNeed === 'water' ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
              Drinking Water
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Free Refills</div>
          </button>

          <button
            onClick={() => handleNeedClick('washroom')}
            className="card card-hover"
            style={{
              padding: '14px',
              textAlign: 'center',
              backgroundColor: activeNeed === 'washroom' ? 'var(--primary-light)' : 'var(--surface)',
              borderColor: activeNeed === 'washroom' ? 'var(--primary)' : 'var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>🚻</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: activeNeed === 'washroom' ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
              Clean Washroom
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Verified Access</div>
          </button>

          <button
            onClick={() => handleNeedClick('charging')}
            className="card card-hover"
            style={{
              padding: '14px',
              textAlign: 'center',
              backgroundColor: activeNeed === 'charging' ? 'var(--primary-light)' : 'var(--surface)',
              borderColor: activeNeed === 'charging' ? 'var(--primary)' : 'var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: activeNeed === 'charging' ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
              Mobile / EV Charge
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Power Docks</div>
          </button>

          <button
            onClick={() => handleNeedClick('shade')}
            className="card card-hover"
            style={{
              padding: '14px',
              textAlign: 'center',
              backgroundColor: activeNeed === 'shade' ? 'var(--primary-light)' : 'var(--surface)',
              borderColor: activeNeed === 'shade' ? 'var(--primary)' : 'var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>⛱️</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: activeNeed === 'shade' ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
              Shade & Rest
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cooling Canopies</div>
          </button>

          <button
            onClick={() => handleNeedClick('medical')}
            className="card card-hover"
            style={{
              padding: '14px',
              textAlign: 'center',
              backgroundColor: activeNeed === 'medical' ? 'var(--primary-light)' : 'var(--surface)',
              borderColor: activeNeed === 'medical' ? 'var(--primary)' : 'var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>🩹</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: activeNeed === 'medical' ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
              First Aid
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Emergency Kit</div>
          </button>
        </div>
      </div>

      {/* Intelligent Recommendations Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="var(--primary)" />
              <h2 style={{ fontSize: 18 }}>Intelligent Rest Recommendations</h2>
            </div>
            <p style={{ fontSize: 13 }}>
              Multi-criteria algorithmic ranking based on operational status, proximity, and verified amenities.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="btn btn-secondary btn-sm"
          >
            View Full Map & List <ArrowRight size={13} />
          </button>
        </div>

        {loadingRecommendations ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Calculating closest rest points...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <p>No rest points found matching your current filter in Peelamedu.</p>
            <button onClick={() => setActiveNeed('all')} className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
              Show All Nearby Points
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {recommendations.slice(0, 6).map((rec) => (
              <FacilityCard
                key={rec.facility.id}
                facility={rec.facility}
                onSelect={(fac) => setSelectedFacility(fac)}
                onBookmarkToggle={handleBookmarkToggle}
                onReportClick={(fac) => setReportFacility(fac)}
                highlightReason={rec.explanation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Break Sessions & Welfare Banner Grid */}
      <div className="grid grid-2">
        {/* Recent Break Sessions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Your Break History</h3>
            <button 
              onClick={() => onNavigate('breaks')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Open Planner & Calculator →
            </button>
          </div>

          {recentBreaks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
              No break sessions logged today yet. Regular rests keep you sharp and prevent road accidents!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentBreaks.map((b) => (
                <div 
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13
                  }}
                >
                  <div>
                    <strong>{b.planned_duration_minutes} min rest</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.facility_name || 'Rest stop'}
                    </div>
                  </div>
                  <span className={`badge ${b.status === 'COMPLETED' ? 'badge-verified' : 'badge-pending'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Welfare Quick Info */}
        <div className="card" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={18} color="var(--success)" />
            <h3 style={{ fontSize: 16, color: '#14532D' }}>Tamil Nadu Gig Worker Welfare</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: '#166534', marginBottom: 14 }}>
            Registered gig delivery riders are eligible for state accident coverage, educational assistance for children, and heatstroke distress compensation.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              onClick={() => onNavigate('support')}
              className="btn btn-secondary btn-sm"
              style={{ backgroundColor: '#FFFFFF', color: '#15803D', fontWeight: 600 }}
            >
              View Welfare Board Contacts
            </button>
            <a 
              href="tel:108" 
              className="btn btn-danger btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              🚨 Dial 108 (Emergency)
            </a>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FacilityDetailModal
        facility={selectedFacility}
        isOpen={!!selectedFacility}
        onClose={() => setSelectedFacility(null)}
        onOpenReport={(fac) => {
          setSelectedFacility(null);
          setReportFacility(fac);
        }}
        onBookmarkToggle={handleBookmarkToggle}
        onStartBreakHere={() => onNavigate('breaks')}
        onFacilityUpdated={() => loadRecommendations(activeNeed)}
      />

      <ReportModal
        facility={reportFacility}
        isOpen={!!reportFacility}
        onClose={() => setReportFacility(null)}
        onSuccess={() => loadRecommendations(activeNeed)}
      />
    </div>
  );
};
