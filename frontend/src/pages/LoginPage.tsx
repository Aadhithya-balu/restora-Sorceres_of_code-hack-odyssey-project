import React, { useState } from 'react';
import { 
  Coffee, Shield, Lock, Mail, Bike, Car, 
  CheckCircle, ArrowRight, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, isAuthenticated, user, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated && user) {
    return (
      <div className="container page-container" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
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
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>You are Signed In</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Logged in as <strong>{user.name}</strong> ({user.email}) • {user.worker_category}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('dashboard')} className="btn btn-primary">
              Worker Dashboard
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
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-container" style={{ maxWidth: 480, margin: '30px auto', padding: '0 16px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10
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

        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>
          Sign In to Restora
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Access your saved rest points, corridor routes, and break impact tracker.
        </p>
      </div>

      <div className="card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-md)' }}>
        {/* Quick Demo Sign In Box */}
        <div style={{
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
            One-Click Test Accounts:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
              onClick={() => handleDemoSignIn('aadhi@restora.app', 'Worker@123')}
              disabled={loading}
            >
              <Bike size={15} color="var(--primary)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Aadhi Narayanan (Delivery Rider)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Peelamedu • aadhi@restora.app</div>
              </div>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
              onClick={() => handleDemoSignIn('suresh@restora.app', 'Worker@123')}
              disabled={loading}
            >
              <Car size={15} color="var(--accent)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Suresh Kumar (Cab Driver)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Coimbatore • suresh@restora.app</div>
              </div>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
              onClick={() => handleDemoSignIn('admin@restora.app', 'Admin@123')}
              disabled={loading}
            >
              <Shield size={15} color="var(--danger)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Platform Administrator</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Moderation & Facility CRUD • admin@restora.app</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

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
            Need an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Register here
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('explore')}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}
          >
            Browse as Guest →
          </button>
        </div>
      </div>
    </div>
  );
};
