import React, { useState } from 'react';
import { 
  Coffee, Shield, Lock, Mail, User as UserIcon, 
  Phone, MapPin, Globe, CheckCircle, ArrowRight, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WorkerCategory } from '../types';

interface SignupPageProps {
  onNavigate: (tab: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { register, isAuthenticated, user, logout } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workerCategory, setWorkerCategory] = useState<WorkerCategory>('delivery_rider');
  const [preferredLanguage, setPreferredLanguage] = useState('Tamil');
  const [workArea, setWorkArea] = useState('Peelamedu, Coimbatore');
  const [hourlyRate, setHourlyRate] = useState<number>(120);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already authenticated, show status
  if (isAuthenticated && user && !success) {
    return (
      <div className="container page-container" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 36 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Already Logged In</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            You are currently signed in as <strong>{user.name}</strong> ({user.email}).
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-primary">
              Go to Dashboard
            </button>
            <button onClick={() => onNavigate('explore')} className="btn btn-outline">
              Explore Rest Map
            </button>
            <button onClick={logout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() ? phone.trim() : undefined,
        worker_category: workerCategory,
        preferred_language: preferredLanguage,
        work_area: workArea.trim() || 'Peelamedu, Coimbatore',
        hourly_rate_estimate: Number(hourlyRate) > 0 ? Number(hourlyRate) : 120
      });

      setSuccess(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-container" style={{ maxWidth: 640, margin: '24px auto', padding: '0 16px 60px' }}>
      {/* Brand & Intro Card */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Coffee size={24} />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Restora
          </span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
          Worker Safety & Rest Registration
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>
          Create your verified account to access Coimbatore's rest points, save favorite rest stops, submit facility verifications, and use RakshitArtha disruption tools.
        </p>
      </div>

      <div className="card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-md)' }}>
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#047857',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <CheckCircle size={20} />
            <span>Registration successful! Welcome to Restora. Navigating to your dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Basic Identity */}
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
              1. Personal Details
            </h3>

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
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>As you would like to be addressed.</span>
            </div>

            <div className="grid grid-2" style={{ gap: 12 }}>
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
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Worker Profile & Work Zone */}
          <div style={{ marginBottom: 18, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
              2. Gig Work Profile
            </h3>

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Worker Category *</label>
                <select
                  className="form-select"
                  value={workerCategory}
                  onChange={(e) => setWorkerCategory(e.target.value as WorkerCategory)}
                >
                  <option value="delivery_rider">🛵 Delivery Rider (Food / Grocery)</option>
                  <option value="cab_driver">🚕 Cab / Auto Driver</option>
                  <option value="courier_worker">📦 Parcel Courier</option>
                  <option value="logistics_worker">🚚 Logistics Worker</option>
                  <option value="other">👷 Other Field Worker</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Language</label>
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

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Primary Transit / Work Corridor</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="E.g. Peelamedu, Avinashi Road"
                  value={workArea}
                  onChange={(e) => setWorkArea(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Helps show nearest rest points.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Est. Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  className="form-input"
                  placeholder="120"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Used privately for your break calculations.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Security */}
          <div style={{ marginBottom: 22, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
              3. Account Security
            </h3>

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Password * (Min 6 chars)</label>
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

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || success}
          >
            {loading ? 'Creating Worker Account...' : 'Complete Registration & Sign In'}
          </button>
        </form>

        {/* Guest and Login Actions */}
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 13
        }}>
          <div>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Sign In here
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('explore')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            Skip & Continue as Guest →
          </button>
        </div>
      </div>

      {/* Trust & Privacy Guard */}
      <div style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 14,
        fontSize: 12,
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="var(--primary)" />
          <span>No KYC or sensitive docs required</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} color="var(--success)" />
          <span>Zero dispatch platform penalties</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coffee size={16} color="var(--accent)" />
          <span>100% Free rest-point discovery</span>
        </div>
      </div>
    </div>
  );
};
