import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, MapPin, Globe, Shield, Bike, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkerCategory } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register } = useAuth();
  
  const [isRegister, setIsRegister] = useState(authModalMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [workerCategory, setWorkerCategory] = useState<WorkerCategory>('delivery_rider');
  const [preferredLanguage, setPreferredLanguage] = useState('Tamil');
  const [workArea, setWorkArea] = useState('Peelamedu, Coimbatore');
  const [hourlyRate, setHourlyRate] = useState<number>(120);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if modal mode changes externally
  React.useEffect(() => {
    setIsRegister(authModalMode === 'register');
    setError(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          worker_category: workerCategory,
          preferred_language: preferredLanguage,
          work_area: workArea.trim(),
          hourly_rate_estimate: Number(hourlyRate) || 120
        });
      } else {
        await login(email.trim(), password);
      }
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20 }}>
              {isRegister ? 'Worker Registration' : 'Welcome to Restora'}
            </h2>
            <p style={{ fontSize: 13 }}>
              {isRegister 
                ? 'Join Coimbatore\'s gig worker rest-point safety network'
                : 'Sign in to access your routes, breaks, and community bookmarks'}
            </p>
          </div>
          <button 
            onClick={closeAuthModal} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Quick Demo Sign In Box */}
        {!isRegister && (
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 12,
            marginBottom: 16
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Quick Demo One-Click Sign In:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleQuickDemo('aadhi@restora.app', 'Worker@123')}
                disabled={loading}
              >
                <Bike size={14} color="var(--primary)" />
                <span>Aadhi (Delivery Rider • Peelamedu)</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleQuickDemo('suresh@restora.app', 'Worker@123')}
                disabled={loading}
              >
                <Car size={14} color="var(--accent)" />
                <span>Suresh (Cab Driver • Coimbatore)</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleQuickDemo('admin@restora.app', 'Admin@123')}
                disabled={loading}
              >
                <Shield size={14} color="var(--danger)" />
                <span>Platform Admin (Moderation & Facility CRUD)</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            marginBottom: 14,
            border: '1px solid #FECACA'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="E.g. Aadhi Narayanan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Worker Category *</label>
                  <select
                    className="form-select"
                    value={workerCategory}
                    onChange={(e) => setWorkerCategory(e.target.value as WorkerCategory)}
                  >
                    <option value="delivery_rider">🛵 Delivery Rider</option>
                    <option value="cab_driver">🚕 Cab / Auto Driver</option>
                    <option value="courier_worker">📦 Parcel Courier</option>
                    <option value="logistics_worker">🚚 Logistics Worker</option>
                    <option value="other">👷 Other Field Worker</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    className="form-select"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Malayalam">Malayalam (മലയാളം)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-2" style={{ gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Primary Work Area</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="E.g. Peelamedu"
                    value={workArea}
                    onChange={(e) => setWorkArea(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Est. Hourly Rate (₹/hr)</label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    className="form-input"
                    placeholder="120"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="worker@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Restora Account' : 'Sign In')}
          </button>
        </form>

        {/* Switcher */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New to Restora?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Register as Worker
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
