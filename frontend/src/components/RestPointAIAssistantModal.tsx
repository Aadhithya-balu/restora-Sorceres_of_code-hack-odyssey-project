import React, { useState } from 'react';
import { 
  Sparkles, X, Send, MapPin, CheckCircle, Clock, 
  Droplets, BatteryCharging, ShieldCheck, AlertCircle, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { Facility, RestPointAIResponse } from '../types';
import { aiApi } from '../services/api';

interface RestPointAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  onSelectFacility: (facility: Facility) => void;
}

const PRESET_PROMPTS = [
  { label: '💧 Water & Washroom', text: 'I need drinking water and a clean washroom nearby' },
  { label: '🔋 Phone Charging & Rest', text: 'Find somewhere to charge my phone and rest for 20 minutes' },
  { label: '🌳 Covered Shade & Rest', text: 'Show me shaded seating and drinking water within 2 km' },
  { label: '🍱 Food & Parking', text: 'Need safe bike parking and cheap food nearby' }
];

export const RestPointAIAssistantModal: React.FC<RestPointAIAssistantModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng,
  onSelectFacility
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RestPointAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.recommendRestpoints({
        query: searchQuery.trim(),
        lat: userLat,
        lng: userLng,
        max_distance_km: 5.0
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 620,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animation: 'modalSlideUp 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#4C1D95' }}>
                  Ask RESTORA AI
                </h3>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                  backgroundColor: '#EDE9FE',
                  color: '#6D28D9'
                }}>
                  Groq LLM
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6D28D9', margin: '2px 0 0 0' }}>
                Natural language discovery powered by real verified Restora facilities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., I need a washroom and drinking water nearby..."
              style={{
                paddingRight: 44,
                borderRadius: 24,
                height: 46,
                fontSize: 14,
                border: '1.5px solid #DDD6FE'
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                position: 'absolute',
                right: 6,
                top: 6,
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !query.trim() ? 0.6 : 1
              }}
            >
              <Send size={15} />
            </button>
          </form>

          {/* Quick Prompts */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
              Quick Suggestions for Riders
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(p.text);
                    handleSearch(p.text);
                  }}
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '30px 16px',
              backgroundColor: '#FAF5FF',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #DDD6FE',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10
            }}>
              <Sparkles size={24} color="#7C3AED" className="animate-spin" />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#6D28D9' }}>
                Analyzing query with Groq LLM & matching real verified Restora rest points...
              </div>
              <div style={{ fontSize: 11, color: '#8B5CF6' }}>
                Retrieving real coordinates & verified community status
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-md)',
              color: '#B91C1C',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Intent Classification Summary */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: 'var(--surface-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Detected Needs:</span>
                  {result.intent.facility_categories.length > 0 ? (
                    result.intent.facility_categories.map((c, i) => (
                      <span key={i} className="badge badge-verified" style={{ fontSize: 10 }}>
                        {c.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>General Rest</span>
                  )}
                  {result.intent.duration_minutes && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      • {result.intent.duration_minutes} mins
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Source: {result.source === 'groq' ? '⚡ Groq Llama-3.3' : '🛡️ Deterministic Engine'}
                </span>
              </div>

              {/* AI Explanation Box */}
              <div style={{
                padding: '14px 16px',
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: '#4C1D95',
                lineHeight: 1.55
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color="#7C3AED" /> AI Rest-Point Recommendation:
                </div>
                "{result.explanation}"
              </div>

              {/* Facilities List (Real Data Only) */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  {result.facilities.length > 0 ? `Matching Verified Facilities (${result.facilities.length})` : 'Alternative Facilities'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(result.facilities.length > 0 ? result.facilities : result.partial_alternatives).map((f) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'border-color 0.15s'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                            {f.name}
                          </span>
                          {f.verification_status === 'VERIFIED' && (
                            <span className="badge badge-verified" style={{ fontSize: 10, padding: '2px 6px' }}>
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          📍 {f.zone || f.city} • <strong style={{ color: 'var(--primary)' }}>{f.distance_meters ? `${f.distance_meters}m away` : 'Nearby'}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                          {f.has_water && <span>💧 Water</span>}
                          {f.has_washroom && <span>🚻 Washroom</span>}
                          {f.has_charging && <span>🔋 Charging</span>}
                          {f.has_shade && <span>🌳 Shade</span>}
                          {f.has_rest && <span>🛋️ Seating</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSelectFacility(f);
                          onClose();
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <span>View on Map</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}

                  {result.facilities.length === 0 && result.partial_alternatives.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13 }}>
                      No verified facilities found matching your criteria within this radius. Try asking for basic shade or water.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
