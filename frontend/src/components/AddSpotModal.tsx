import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Check, Sparkles, Navigation, Droplet, 
  BatteryCharging, Coffee, Shield, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { facilityApi } from '../services/api';
import { Facility } from '../types';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpotAdded?: (spot: Facility) => void;
}

export const AddSpotModal: React.FC<AddSpotModalProps> = ({
  isOpen,
  onClose,
  onSpotAdded
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { location, refreshLocation } = useLocation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('WASHROOM');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('Peelamedu');
  const [city, setCity] = useState('Coimbatore');
  const [lat, setLat] = useState<number>(location.lat ?? 11.0267);
  const [lng, setLng] = useState<number>(location.lng ?? 77.0118);

  // Availability
  const [availabilityMode, setAvailabilityMode] = useState<'24_7' | 'open_now' | 'custom'>('open_now');
  const [customHours, setCustomHours] = useState('06:00 - 23:00');

  // Services
  const [hasWater, setHasWater] = useState(true);
  const [hasWashroom, setHasWashroom] = useState(true);
  const [hasCharging, setHasCharging] = useState(false);
  const [hasRest, setHasRest] = useState(false);
  const [hasShade, setHasShade] = useState(false);
  const [hasParking, setHasParking] = useState(true);
  const [hasFood, setHasFood] = useState(false);
  const [hasMedical, setHasMedical] = useState(false);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync GPS coordinates when opened
  useEffect(() => {
    if (isOpen && location.lat && location.lng) {
      setLat(location.lat);
      setLng(location.lng);
    }
  }, [isOpen, location]);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    refreshLocation();
    if (location.lat && location.lng) {
      setLat(location.lat);
      setLng(location.lng);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this facility.');
      return;
    }
    if (!address.trim()) {
      setError('Please provide an approximate address or landmark.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const operating_hours = availabilityMode === '24_7' 
        ? '24 Hours Open' 
        : availabilityMode === 'custom' 
          ? customHours 
          : '07:00 - 22:30 (Open Now)';

      const created = await facilityApi.createFacility({
        name: name.trim(),
        category,
        address: address.trim(),
        zone: zone.trim() || 'Central',
        city: city.trim() || 'Coimbatore',
        lat: Number(lat),
        lng: Number(lng),
        is_open: true,
        operating_hours,
        is_24_7: availabilityMode === '24_7',
        access_type: 'PUBLIC',
        pricing_info: 'Free for gig delivery workers',
        accessibility_info: 'Ground level, 2W parking accessible',
        has_water: hasWater,
        has_washroom: hasWashroom,
        has_charging: hasCharging,
        has_rest: hasRest,
        has_shade: hasShade,
        has_parking: hasParking,
        has_food: hasFood,
        has_medical: hasMedical,
        verification_status: 'PENDING',
        notes: notes.trim() || 'Worker crowdsourced submission awaiting verification'
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        // Reset form
        setName('');
        setAddress('');
        setNotes('');
        onClose();
        if (onSpotAdded) onSpotAdded(created);
      }, 2400);
    } catch (err: any) {
      setError(err.message || 'Failed to submit spot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-verified" style={{ fontSize: 10 }}>
                <Sparkles size={11} /> +15 Points
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Community Crowdsource</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '4px 0 0' }}>
              Add a Roadside Spot
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Check size={32} />
            </div>
            <h4 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
              Submission Received!
            </h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto' }}>
              Your spot has been sent for verification. Once approved by our moderation team, it will turn officially verified on the map!
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 18,
              padding: '8px 16px',
              backgroundColor: '#EFF6FF',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              <Sparkles size={16} /> +15 Contribution Points Awarded
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13
              }}>
                {error}
              </div>
            )}

            {/* Spot Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Spot Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="E.g., Bharat Petroleum 24/7 Rest Bay"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="form-label">Primary Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {[
                  { id: 'WASHROOM', label: 'Washroom', icon: '🚻' },
                  { id: 'WATER', label: 'Water', icon: '💧' },
                  { id: 'SHADE_REST', label: 'Shade / Rest', icon: '🌳' },
                  { id: 'CHARGING', label: 'Charging', icon: '🔋' },
                  { id: 'FOOD', label: 'Food', icon: '🍱' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'WASHROOM') setHasWashroom(true);
                      if (cat.id === 'WATER') setHasWater(true);
                      if (cat.id === 'CHARGING') setHasCharging(true);
                      if (cat.id === 'SHADE_REST') { setHasRest(true); setHasShade(true); }
                      if (cat.id === 'FOOD') setHasFood(true);
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 10,
                      border: category === cat.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: category === cat.id ? 'var(--primary-light)' : 'var(--surface)',
                      color: category === cat.id ? 'var(--primary-dark)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: category === cat.id ? 700 : 500,
                      fontSize: 12,
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Services */}
            <div>
              <label className="form-label">Available Amenities & Services</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasWater} onChange={(e) => setHasWater(e.target.checked)} />
                  💧 Drinking Water
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasWashroom} onChange={(e) => setHasWashroom(e.target.checked)} />
                  🚻 Washroom / Toilet
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasCharging} onChange={(e) => setHasCharging(e.target.checked)} />
                  🔋 Charging Sockets
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
                  🛵 2-Wheeler Parking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasRest} onChange={(e) => setHasRest(e.target.checked)} />
                  🪑 Seating Benches
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasShade} onChange={(e) => setHasShade(e.target.checked)} />
                  ⛱️ Shaded Canopy
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasFood} onChange={(e) => setHasFood(e.target.checked)} />
                  🍱 Food / Tea Point
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={hasMedical} onChange={(e) => setHasMedical(e.target.checked)} />
                  🩹 First-Aid Box
                </label>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="form-label">Availability / Working Hours</label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="availMode" 
                    checked={availabilityMode === 'open_now'} 
                    onChange={() => setAvailabilityMode('open_now')} 
                  />
                  Open now
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="availMode" 
                    checked={availabilityMode === '24_7'} 
                    onChange={() => setAvailabilityMode('24_7')} 
                  />
                  24 / 7
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="availMode" 
                    checked={availabilityMode === 'custom'} 
                    onChange={() => setAvailabilityMode('custom')} 
                  />
                  Specific hours
                </label>
              </div>

              {availabilityMode === 'custom' && (
                <input
                  type="text"
                  className="form-input"
                  placeholder="E.g., 06:00 - 23:00"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                />
              )}
            </div>

            {/* Location & GPS */}
            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <MapPin size={16} color="var(--primary)" />
                  <span>Spot Location</span>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  <Navigation size={12} /> Use GPS Coords
                </button>
              </div>

              <div className="grid grid-2" style={{ gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Address / Landmark *"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Area / Zone (e.g., Peelamedu)"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                GPS: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
              </div>
            </div>

            {/* Notes / Rider Tips */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rider Notes & Accessibility Tips</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="E.g., Located behind the petrol pump office, free cold RO water available."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Trust disclaimer */}
            <div style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              lineHeight: 1.4,
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              padding: '8px 12px',
              borderRadius: 8
            }}>
              ℹ️ Spots are submitted as <strong>Pending Verification</strong> and audited by admin moderators before showing as officially verified.
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Spot (+15 pts)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
