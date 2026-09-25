import React, { useState, useEffect } from 'react';
import { 
  Coffee, Clock, ShieldCheck, AlertCircle, Heart, 
  CheckCircle, Play, Square, Sparkles, TrendingUp, HelpCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BreakSession, IncomeImpactEstimate, Facility } from '../types';
import { breakApi, facilityApi } from '../services/api';

export const BreaksPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [breaks, setBreaks] = useState<BreakSession[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);

  // New break form state
  const [plannedMinutes, setPlannedMinutes] = useState(15);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | undefined>(undefined);
  const [breakNotes, setBreakNotes] = useState('');
  const [activeSession, setActiveSession] = useState<BreakSession | null>(null);

  // Income estimator state
  const [hourlyRate, setHourlyRate] = useState<number>(user?.hourly_rate_estimate || 120);
  const [calcMinutes, setCalcMinutes] = useState<number>(15);
  const [impactEstimate, setImpactEstimate] = useState<IncomeImpactEstimate | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

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

  const calculateImpact = async (rate: number, mins: number) => {
    try {
      setLoadingImpact(true);
      const res = await breakApi.estimateImpact({
        hourly_rate_estimate: rate,
        planned_break_minutes: mins
      });
      setImpactEstimate(res);
    } catch {
      // fallback local
      setImpactEstimate({
        hourly_rate: rate,
        break_minutes: mins,
        estimated_opportunity_amount: Math.round((rate / 60) * mins),
        disclaimer: 'Calculated purely for worker insight.',
        health_benefit_note: 'Rest prevents fatigue and heat exhaustion.'
      });
    } finally {
      setLoadingImpact(false);
    }
  };

  useEffect(() => {
    loadData();
    calculateImpact(hourlyRate, calcMinutes);
  }, [isAuthenticated]);

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
      await breakApi.updateBreak(activeSession.id, {
        status: 'COMPLETED',
        actual_duration_minutes: activeSession.planned_duration_minutes
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

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Coffee size={24} color="var(--primary)" />
          <h1 style={{ fontSize: 24 }}>Voluntary Break Planner & Health Safeguards</h1>
        </div>
        <p style={{ fontSize: 14 }}>
          Resting between delivery orders is vital for alertness and heatstroke prevention. Track your breaks privately with transparent income opportunity insights.
        </p>
      </div>

      {/* Active Break Banner if currently active */}
      {activeSession && (
        <div style={{
          backgroundColor: '#ECFDF5',
          border: '2px solid #059669',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-verified">
                <Clock size={12} /> Break In Progress
              </span>
              <span style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                {activeSession.planned_duration_minutes} Minutes Planned
              </span>
            </div>
            <h3 style={{ color: '#064E3B', fontSize: 18 }}>
              Take a deep breath and hydrate! 💧
            </h3>
            <p style={{ fontSize: 13, color: '#065F46', marginTop: 4 }}>
              Started at {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {activeSession.facility_name ? ` at ${activeSession.facility_name}` : ''}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleCompleteBreak}
              className="btn btn-primary"
              style={{ backgroundColor: '#059669' }}
            >
              <CheckCircle size={16} /> Finish Break & Resume Orders
            </button>
            <button
              onClick={handleCancelBreak}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Planner Form + Income Impact Estimator */}
      <div className="grid grid-2">
        {/* Break Logger Form */}
        <div className="card">
          <h3 style={{ fontSize: 18, marginBottom: 6 }}>Log a Voluntary Break</h3>
          <p style={{ fontSize: 13, marginBottom: 16 }}>
            Set a reminder and log your rest period. Data is kept private to your account.
          </p>

          <form onSubmit={handleStartBreak}>
            <div className="form-group">
              <label className="form-label">Break Duration</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[10, 15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      setPlannedMinutes(mins);
                      setCalcMinutes(mins);
                      calculateImpact(hourlyRate, mins);
                    }}
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
                <option value="">-- Any roadside shade / Current spot --</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.zone})
                  </option>
                ))}
              </select>
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

        {/* Illustrative Income Impact Estimator with Safeguards */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 18 }}>Personal Income Impact Estimator</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Transparent educational estimation of opportunity cost vs fatigue risk.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Your Estimated Hourly Rate (₹/hr)</label>
              <input
                type="number"
                min="50"
                max="500"
                className="form-input"
                value={hourlyRate}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setHourlyRate(val);
                  calculateImpact(val, calcMinutes);
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rest Break Duration (mins)</label>
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                className="form-input"
                value={calcMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCalcMinutes(val);
                  calculateImpact(hourlyRate, val);
                }}
              />
            </div>
          </div>

          {/* Impact Result Card */}
          {impactEstimate && (
            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Estimated Theoretical Opportunity Cost:
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{impactEstimate.estimated_opportunity_amount}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Based on ₹{impactEstimate.hourly_rate}/hr rate over {impactEstimate.break_minutes} minutes of idle rest.
              </div>
            </div>
          )}

          {/* Ethical Safeguard Notice */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            fontSize: 12,
            color: '#1E40AF',
            lineHeight: 1.5
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={14} color="#EF4444" fill="#EF4444" /> Health & Safety Reality Check:
            </div>
            {impactEstimate?.health_benefit_note || 'Resting prevents heat exhaustion and costly bike repair incidents.'}
            <div style={{ marginTop: 6, fontSize: 11, color: '#3B82F6' }}>
              🛡️ {impactEstimate?.disclaimer || 'Restora never penalizes or transmits your break data to gig platforms.'}
            </div>
          </div>
        </div>
      </div>

      {/* Break History Table */}
      <div className="card">
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Your Rest History</h3>

        {breaks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: 13 }}>
            {isAuthenticated 
              ? 'No break sessions recorded yet. Start your first 15-minute break above!' 
              : 'Sign in to sync your break session history across devices.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Date & Time</th>
                  <th style={{ padding: '8px 12px' }}>Facility</th>
                  <th style={{ padding: '8px 12px' }}>Planned</th>
                  <th style={{ padding: '8px 12px' }}>Actual</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {breaks.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      {new Date(b.start_time).toLocaleDateString()} {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      {b.facility_name || 'Roadside rest'}
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
