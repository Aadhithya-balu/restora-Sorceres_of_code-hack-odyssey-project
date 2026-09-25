import React, { useState, useEffect } from 'react';
import { 
  Coffee, Clock, ShieldCheck, Heart, 
  CheckCircle, Play, Sparkles, Droplets, Sun, 
  BatteryCharging, Eye, AlertTriangle, ArrowRight, XCircle, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BreakSession, Facility } from '../types';
import { breakApi, facilityApi } from '../services/api';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useLocation } from '../hooks/useLocation';

interface BreaksPageProps {
  onNavigate?: (tab: string) => void;
}

export const BreaksPage: React.FC<BreaksPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { location } = useLocation();

  const [breaks, setBreaks] = useState<BreakSession[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);

  // New break form state
  const [plannedMinutes, setPlannedMinutes] = useState(15);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | undefined>(undefined);
  const [breakNotes, setBreakNotes] = useState('');
  const [activeSession, setActiveSession] = useState<BreakSession | null>(null);

  // Elapsed timer state for active break
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Optional live weather telemetry for heat/weather safety guidance
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [facs, brkList] = await Promise.all([
        facilityApi.getFacilities(),
        isAuthenticated ? breakApi.getBreaks() : Promise.resolve([])
      ]);
      setFacilities(facs);
      setBreaks(brkList);

      const ongoing = brkList.find(b => b.status === 'ACTIVE');
      if (ongoing) {
        setActiveSession(ongoing);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Load weather telemetry for local heat safeguards (non-blocking)
  useEffect(() => {
    const lat = location.lat || 11.0267;
    const lng = location.lng || 77.0118;
    fetchWeather(lat, lng)
      .then(w => setWeather(w))
      .catch(() => {
        // Silent fallback - weather is an optional safeguard enhancer
      });
  }, [location.lat, location.lng]);

  // Track live timer when a break is active
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(activeSession.start_time).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartBreak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      const created = await breakApi.createBreak({
        facility_id: selectedFacilityId,
        planned_duration_minutes: plannedMinutes,
        notes: breakNotes.trim() || undefined
      });
      // Mark as ACTIVE
      const updated = await breakApi.updateBreak(created.id, { status: 'ACTIVE' });
      setActiveSession(updated);
      setBreakNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to start break session');
    }
  };

  const handleCompleteBreak = async () => {
    if (!activeSession) return;
    try {
      const actualMins = Math.max(1, Math.round(elapsedSeconds / 60)) || activeSession.planned_duration_minutes;
      await breakApi.updateBreak(activeSession.id, {
        status: 'COMPLETED',
        actual_duration_minutes: actualMins
      });
      setActiveSession(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete break');
    }
  };

  const handleCancelBreak = async () => {
    if (!activeSession) return;
    try {
      await breakApi.updateBreak(activeSession.id, {
        status: 'CANCELLED'
      });
      setActiveSession(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel break');
    }
  };

  // Helper for time ago formatting
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    return new Date(isoString).toLocaleDateString();
  };

  // Quality & Rest Metrics (Today)
  const todayStr = new Date().toDateString();
  const todayCompletedBreaks = breaks.filter(b => {
    if (!b.start_time) return false;
    return new Date(b.start_time).toDateString() === todayStr && b.status === 'COMPLETED';
  });
  const todayTotalRestMinutes = todayCompletedBreaks.reduce(
    (sum, b) => sum + (b.actual_duration_minutes || b.planned_duration_minutes || 0),
    0
  );
  const lastCompletedBreak = breaks.find(b => b.status === 'COMPLETED');

  // Dynamic health guidance per selected duration
  const getHealthGuidance = (mins: number) => {
    if (mins <= 10) {
      return {
        tag: 'Quick Recovery',
        title: 'Quick Recovery Break (10 mins)',
        description: 'Quick recovery break — hydrate, stretch, and rest your eyes.',
        focus: [
          'Hydrate immediately with 250ml cool water or electrolytes.',
          'Rest your eyes completely away from bright smartphone screens.',
          'Gently roll your shoulders, neck, and wrists to relieve riding posture tension.'
        ]
      };
    } else if (mins <= 15) {
      return {
        tag: 'Short Recovery',
        title: 'Good Short Recovery Break (15 mins)',
        description: 'Good short recovery break — hydrate, sit comfortably, and check your next ride.',
        focus: [
          'Hydrate and step off the bike to allow engine heat to disperse.',
          'Sit comfortably with back support to decompress spinal lumbar strain.',
          'Check your next delivery route calmly without rushing before mounting.'
        ]
      };
    } else if (mins <= 20) {
      return {
        tag: 'Rest & Replenish',
        title: 'Replenishment Break (20 mins)',
        description: 'Use this break to hydrate, eat if needed, and recover before continuing.',
        focus: [
          'Hydrate and have a light snack (tender coconut, fruit, or energy bar).',
          'Let your phone cool down in shaded airflow to prevent thermal battery drain.',
          'Take 5 deep breaths to lower heart rate and reduce traffic stress.'
        ]
      };
    } else {
      return {
        tag: 'Extended Recovery',
        title: `Comprehensive Recovery Break (${mins} mins)`,
        description: 'Longer recovery break — consider food, hydration, phone charging, and vehicle checks.',
        focus: [
          'Enjoy a proper nutritious meal and substantial hydration (500ml+).',
          'Plug your phone and power bank in at a verified Restora charging station.',
          'Conduct a quick vehicle check: tire pressure, brake responsiveness, and rearview mirrors.',
          'Rest in a shaded or cooled indoor rest stop before your next shift window.'
        ]
      };
    }
  };

  const guidance = getHealthGuidance(plannedMinutes);
  const plannedSecs = (activeSession?.planned_duration_minutes || 15) * 60;
  const remainingSecs = Math.max(0, plannedSecs - elapsedSeconds);
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Coffee size={24} color="var(--primary)" />
          <h1 style={{ fontSize: 24 }}>Voluntary Break Planner & Health Safeguards</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
          Plan healthy breaks between delivery orders, track your rest periods, and stay safer during long working hours.
        </p>
      </div>

      {/* Break Quality Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12
      }}>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#ECFDF5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Coffee size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Today's Breaks</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {todayCompletedBreaks.length} {todayCompletedBreaks.length === 1 ? 'session' : 'sessions'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Rest Today</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              {todayTotalRestMinutes} min
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Heart size={20} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Last Rest Session</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {lastCompletedBreak ? formatTimeAgo(lastCompletedBreak.start_time) : 'No breaks yet today'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Break Banner with Real-time Timer */}
      {activeSession && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '2px solid #059669',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-verified" style={{ fontSize: 12, padding: '4px 10px' }}>
                <Clock size={13} className="animate-spin" /> Break In Progress
              </span>
              <span style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                {activeSession.planned_duration_minutes} Minutes Planned
              </span>
            </div>
            <h3 style={{ color: '#064E3B', fontSize: 20, margin: '2px 0 6px 0' }}>
              Take a deep breath and hydrate! 💧
            </h3>
            <p style={{ fontSize: 13, color: '#065F46', margin: 0 }}>
              Started at {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {activeSession.facility_name ? ` at ${activeSession.facility_name}` : ' (Roadside rest)'}.
            </p>
          </div>

          {/* Live Timer Countdown & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#047857', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {elapsedSeconds < plannedSecs ? 'Time Remaining' : 'Break Time Complete'}
              </div>
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: elapsedSeconds < plannedSecs ? '#065F46' : '#B45309',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {elapsedSeconds < plannedSecs ? formatTimer(remainingSecs) : `+${formatTimer(elapsedSeconds - plannedSecs)}`}
              </div>
              <div style={{ fontSize: 11, color: '#059669' }}>
                Elapsed: {formatTimer(elapsedSeconds)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCompleteBreak}
                className="btn btn-primary"
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle size={16} /> Finish Break & Resume Orders
              </button>
              <button
                onClick={handleCancelBreak}
                className="btn btn-secondary btn-sm"
              >
                <XCircle size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Planner Form + Health & Safety Safeguards */}
      <div className="grid grid-2">
        {/* Section 1: Break Logger Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Clock size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 18 }}>Log a Voluntary Break</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
            Set a reminder and log your rest period. Data is kept strictly confidential to your account.
          </p>

          <form onSubmit={handleStartBreak}>
            <div className="form-group">
              <label className="form-label">Break Duration</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[10, 15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPlannedMinutes(mins)}
                    className={`btn btn-sm ${plannedMinutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {mins} mins
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rest Point (Optional)</label>
              <select
                className="form-select"
                value={selectedFacilityId || ''}
                onChange={(e) => setSelectedFacilityId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Current spot / Roadside shade --</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.zone || 'Rest Point'}){f.verification_status === 'VERIFIED' ? ' ✓ Verified' : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Select a verified Restora spot for shaded seating, drinking water, or device charging.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Session Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="E.g., Drank coconut water, phone charged to 70%"
                value={breakNotes}
                onChange={(e) => setBreakNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={!!activeSession}
            >
              <Play size={15} /> Start {plannedMinutes}-Minute Break Now
            </button>
          </form>
        </div>

        {/* Section 2: Break Health Check & Restora Guidance */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={20} color="#E11D48" fill="#FFE4E6" />
            <h3 style={{ fontSize: 18 }}>Break Health Check</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Regular short breaks can help reduce fatigue and maintain alertness during long working hours.
          </p>

          {/* Dynamic Guidance Box based on selected plannedMinutes */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                {guidance.title}
              </span>
              <span className="badge badge-verified" style={{ fontSize: 11 }}>
                {guidance.tag}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 12, fontWeight: 500 }}>
              "{guidance.description}"
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guidance.focus.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <CheckCircle size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Local Weather / Heat Safeguard Advisory */}
          {weather && weather.temperature > 32 && (
            <div style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: 12,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Sun size={20} color="#D97706" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>High Heat Detected ({weather.temperature}°C)</strong>
                Consider resting in covered shade and replenishing electrolytes to prevent thermal exhaustion.
              </div>
            </div>
          )}

          {/* Worker Privacy Safeguard */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            fontSize: 12,
            color: '#1E40AF',
            lineHeight: 1.5,
            marginTop: 'auto'
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="#2563EB" /> Restora Privacy Safeguard:
            </div>
            Restora never penalizes or transmits your break data to gig platforms. Your rest periods are strictly personal for your health, recovery, and road safety.
          </div>
        </div>
      </div>

      {/* Separate RakshitArtha Income Protection Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        border: '1px solid #BFDBFE',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '20px 24px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontWeight: 700 }}>
              Parametric Financial Protection
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Separate RakshitArtha Module</span>
          </div>
          <h3 style={{ fontSize: 17, color: '#1E3A8A', margin: '4px 0' }}>
            Looking for income protection during work disruptions?
          </h3>
          <p style={{ fontSize: 13, color: '#3B82F6', margin: 0, lineHeight: 1.5 }}>
            Taking short rest breaks preserves your alertness and physical safety. If you need financial coverage against heavy rain, severe heatwaves, or platform outages preventing you from working, visit RakshitArtha.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onNavigate) {
              onNavigate('rakshitartha');
            } else if (typeof window !== 'undefined') {
              window.location.hash = 'rakshitartha';
            }
          }}
          className="btn btn-primary"
          style={{
            backgroundColor: '#2563EB',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap'
          }}
        >
          Open RakshitArtha <ArrowRight size={16} />
        </button>
      </div>

      {/* Break History Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 18 }}>Your Rest History</h3>
          {breaks.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {breaks.length} recorded {breaks.length === 1 ? 'session' : 'sessions'}
            </span>
          )}
        </div>

        {breaks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
            {isAuthenticated 
              ? 'No break sessions recorded yet. Start your first 15-minute break above!' 
              : 'Sign in to sync your break session history across devices.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px' }}>Date & Time</th>
                  <th style={{ padding: '10px 12px' }}>Rest Point</th>
                  <th style={{ padding: '10px 12px' }}>Planned</th>
                  <th style={{ padding: '10px 12px' }}>Actual</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Session Notes</th>
                </tr>
              </thead>
              <tbody>
                {breaks.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {new Date(b.start_time).toLocaleDateString()} {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      {b.facility_name || 'Roadside shade'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {b.planned_duration_minutes} min
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {b.actual_duration_minutes ? `${b.actual_duration_minutes} min` : '-'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${b.status === 'COMPLETED' ? 'badge-verified' : b.status === 'ACTIVE' ? 'badge-pending' : 'badge-neutral'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {b.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
