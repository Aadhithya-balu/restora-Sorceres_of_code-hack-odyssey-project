import React, { useState } from 'react';
import { X, AlertCircle, Send, Check } from 'lucide-react';
import { Facility } from '../types';
import { reportApi } from '../services/api';

interface ReportModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_TYPES = [
  { value: 'WATER_OUT_OF_ORDER', label: '💧 Drinking Water Not Working / Empty' },
  { value: 'WASHROOM_DIRTY_LOCKED', label: '🚻 Washroom Locked or Unhygienic' },
  { value: 'CHARGING_NOT_WORKING', label: '⚡ Charging Point Broken / No Power' },
  { value: 'FACILITY_CLOSED', label: '🚫 Facility Temporarily or Permanently Closed' },
  { value: 'ACCESS_DENIED', label: '⛔ Access Denied to Gig Delivery Workers' },
  { value: 'SAFETY_CONCERN', label: '⚠️ Safety Hazard / Poor Lighting at Night' },
  { value: 'INCORRECT_HOURS', label: '🕒 Operating Hours Listed Are Incorrect' },
  { value: 'OTHER', label: '📝 Other Facility Update' }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  facility,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reportType, setReportType] = useState('WATER_OUT_OF_ORDER');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief explanation of the condition.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reportApi.createReport({
        facility_id: facility.id,
        report_type: reportType,
        description: description.trim(),
        image_url: imageUrl.trim() || undefined
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        setImageUrl('');
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>
              Crowdsourced Condition Report
            </span>
            <h2 style={{ fontSize: 18, marginTop: 2 }}>{facility.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{facility.address}</p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {submitted ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 10px',
            backgroundColor: 'var(--success-bg)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--success)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Check size={28} />
            </div>
            <h3 style={{ color: 'var(--success)', fontSize: 18 }}>Report Submitted!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
              Thank you for keeping fellow gig workers informed. Restora moderators review community reports promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid #FECACA',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Issue or Facility Status Change *</label>
              <select 
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Details / Condition Description *</label>
              <textarea 
                className="form-textarea"
                rows={3}
                placeholder="E.g., Water dispenser had no glasses/was dry at 2 PM. Gate was closed by security."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Photo Proof URL (Optional)</label>
              <input 
                type="url"
                className="form-input"
                placeholder="https://images.example.com/photo.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Helpful for verifying locked restrooms, broken taps, or barricades.
              </span>
            </div>

            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              padding: 12,
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 16
            }}>
              🤝 <strong>Community Trust:</strong> Verified reports directly notify gig riders in Peelamedu and prevent wasted stops.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={14} /> Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
