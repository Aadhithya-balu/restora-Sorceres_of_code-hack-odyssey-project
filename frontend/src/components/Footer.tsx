import React from 'react';
import { Coffee, Shield, Heart, MapPin, ExternalLink } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer style={{
      backgroundColor: '#0F172A',
      color: '#94A3B8',
      padding: '48px 0 24px',
      borderTop: '1px solid #1E293B',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 32,
          marginBottom: 36
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Coffee size={18} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Restora
              </span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94A3B8', marginBottom: 12 }}>
              Gig-Worker Rest-Point Network. Connecting food delivery riders, cab drivers, and logistics field workers to verified drinking water, hygienic washrooms, charging docks, and safe resting corridors.
            </p>
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="var(--primary)" /> Active in Coimbatore (Peelamedu, Hope College, TIDEL)
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Restora Modules
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <button 
                onClick={() => setActiveTab('explore')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                🗺️ Explore Rest Points & Map
              </button>
              <button 
                onClick={() => setActiveTab('route')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                🛣️ Rest-Aware Corridor Routing
              </button>
              <button 
                onClick={() => setActiveTab('breaks')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                ☕ Voluntary Break Planner & Impact
              </button>
              <button 
                onClick={() => setActiveTab('rakshitartha')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                🛡️ RakshitArtha Disruption Support
              </button>
              <button 
                onClick={() => setActiveTab('support')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                🏥 Welfare Resources & Emergency
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                🛡️ Moderator & Facility Admin
              </button>
            </div>
          </div>

          {/* Ethical Commitment & Worker Rights */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Worker Well-Being & Dignity
            </h4>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: '#94A3B8', marginBottom: 12 }}>
              Restora is designed with worker privacy first. Taking voluntary rests is essential for cognitive alertness, heatstroke prevention, and road safety. We do not transmit worker break durations to delivery platform dispatch algorithms.
            </p>
            <div style={{
              backgroundColor: '#1E293B',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              color: '#CBD5E1'
            }}>
              ⚖️ <strong>Legal & Fair Use:</strong> Facility access policies conform to municipal public utility and verified local business partner agreements.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid #1E293B',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          fontSize: 12
        }}>
          <div>
            © {new Date().getFullYear()} Restora — Gig-Worker Rest-Point Network. Built for dignity and road safety.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}>
            <span>Built with care for India's essential gig workers</span>
            <Heart size={14} color="#EF4444" fill="#EF4444" />
          </div>
        </div>
      </div>
    </footer>
  );
};
