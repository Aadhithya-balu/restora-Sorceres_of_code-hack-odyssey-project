import React from 'react';
import { 
  Coffee, MapPin, Route, Shield, Heart, 
  CheckCircle, ArrowRight, Droplet, BatteryCharging, 
  Users, Activity, Sparkles, Navigation 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 60, paddingBottom: 60 }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '60px 0 40px'
      }}>
        <div className="container">
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              color: 'var(--primary-dark)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 20
            }}>
              <Sparkles size={15} />
              <span>Restora: India's Essential Gig-Worker Rest-Point Network</span>
            </div>

            <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', lineHeight: 1.15, marginBottom: 18, color: '#0F172A' }}>
              Dignified Rest, Hydration & Safety for Every Gig Worker
            </h1>

            <p style={{ fontSize: 'clamp(16px, 2.5vw, 19px)', lineHeight: 1.6, color: '#475569', marginBottom: 28 }}>
              Finding clean washrooms, free drinking water, shady respite, and reliable phone charging shouldn't be a daily struggle. Restora connects delivery riders, cab drivers, and field workers to verified rest points across urban transit corridors.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button 
                onClick={() => onNavigate('explore')}
                className="btn btn-primary btn-lg"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <MapPin size={18} />
                <span>Find Rest Points Near Me</span>
              </button>

              <button 
                onClick={() => onNavigate('route')}
                className="btn btn-outline btn-lg"
              >
                <Route size={18} />
                <span>Plan Rest on Route</span>
              </button>

              {!isAuthenticated && (
                <button 
                  onClick={() => openAuthModal('login')}
                  className="btn btn-secondary btn-lg"
                >
                  <span>Worker Sign In</span>
                </button>
              )}
            </div>

            {/* Quick trust metrics */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 32,
              marginTop: 40,
              paddingTop: 24,
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              fontSize: 13,
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--success)" />
                <span><strong>100% Free</strong> to browse & use</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--success)" />
                <span><strong>Crowd-Verified</strong> in Peelamedu & Coimbatore</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color="var(--success)" />
                <span><strong>Zero Platform Penalties</strong> for taking breaks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Everyday Reality: Problem Statement */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            The Reality On the Road
          </span>
          <h2 style={{ fontSize: 28, marginTop: 4 }}>Why Restora Exists</h2>
          <p style={{ fontSize: 15, marginTop: 8 }}>
            Millions of gig workers power food, grocery, and mobility logistics across Indian cities. Yet basic human amenities remain out of reach.
          </p>
        </div>

        <div className="grid grid-4">
          <div className="card" style={{ borderTop: '4px solid #EF4444' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>☀️</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>12-Hour Heat Exposure</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              Riders endure 38°C–44°C temperatures with zero access to shade, risking heat exhaustion, headaches, and road accidents.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #F59E0B' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🚻</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Washroom Denial</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              Commercial complexes and upscale restaurants frequently prohibit delivery workers from using their restrooms.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #06B6D4' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>💧</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Unreliable Water</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              Workers spend hard-earned money buying bottled water when dispensers are dry, broken, or behind restricted gates.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #8B5CF6' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🔋</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Battery & EV Stress</h3>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>
              Delivery apps drain smartphone batteries rapidly, leaving riders stranded without charging plugs or EV swap points.
            </p>
          </div>
        </div>
      </section>

      {/* Restora Core Modules Overview */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 36px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Comprehensive Infrastructure
          </span>
          <h2 style={{ fontSize: 28, marginTop: 4 }}>How Restora Protects You</h2>
          <p style={{ fontSize: 15, marginTop: 8 }}>
            Engineered specifically for gig workers with real-world constraints: quick access, minimal detour, and trusted verification.
          </p>
        </div>

        <div className="grid grid-3">
          <div className="card card-hover" onClick={() => onNavigate('explore')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <MapPin size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Rest-Point Discovery</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Explore petrol pumps, community shelters, metro stations, and partner tea stalls with clear access permissions and operating hours.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
              Explore Map <ArrowRight size={14} />
            </div>
          </div>

          <div className="card card-hover" onClick={() => onNavigate('route')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Route size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Corridor Route Matching</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Input your pickup and drop points to discover facilities directly on your corridor with calculated detour estimates (within 500m to 2km).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600, fontSize: 13 }}>
              Plan Route <ArrowRight size={14} />
            </div>
          </div>

          <div className="card card-hover" onClick={() => onNavigate('breaks')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Coffee size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Break Planner & Income Impact</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Plan restorative breaks with transparent opportunity cost estimates and clear health safeguards. Zero algorithm penalization.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D97706', fontWeight: 600, fontSize: 13 }}>
              Break Planner <ArrowRight size={14} />
            </div>
          </div>

          <div className="card card-hover" onClick={() => onNavigate('explore')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#F0FDF4',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Crowd Verification</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Workers report broken taps, locked doors, or hostile security. Community verifications update facility status in real-time.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600, fontSize: 13 }}>
              View Verifications <ArrowRight size={14} />
            </div>
          </div>

          <div className="card card-hover" onClick={() => onNavigate('support')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Heart size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Welfare & Emergency</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Direct access to Tamil Nadu Gig Workers Welfare Board, emergency trauma hotlines, hydration guidelines, and clinic partners.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', fontWeight: 600, fontSize: 13 }}>
              Get Support <ArrowRight size={14} />
            </div>
          </div>

          <div className="card card-hover" onClick={() => onNavigate('admin')} style={{ cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: '#F3E8FF',
              color: '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Admin Moderation & Gaps</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Platform admins moderate submitted condition reports, manage facilities, and analyze corridor service gaps across city zones.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7C3AED', fontWeight: 600, fontSize: 13 }}>
              Admin Panel <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="container">
        <div style={{
          backgroundColor: 'var(--primary)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '44px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h2 style={{ color: '#FFFFFF', fontSize: 28, marginBottom: 12 }}>
            Start Riding with Confidence & Dignity Today
          </h2>
          <p style={{ color: '#CCFBF1', fontSize: 16, maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Join thousands of gig delivery riders, auto-rickshaw drivers, and courier professionals using Restora across Coimbatore.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('explore')}
              className="btn btn-secondary btn-lg"
              style={{ backgroundColor: '#FFFFFF', color: 'var(--primary)', fontWeight: 700 }}
            >
              Open Rest-Point Network
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="btn btn-outline btn-lg"
              style={{ borderColor: '#FFFFFF', color: '#FFFFFF' }}
            >
              Go to Worker Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
