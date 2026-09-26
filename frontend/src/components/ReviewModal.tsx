import React, { useState } from 'react';
import { X, Star, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { Facility } from '../types';
import { facilityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReviewModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  facility,
  isOpen,
  onClose,
  onReviewSubmitted
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [accessibility, setAccessibility] = useState<number>(5);
  const [safety, setSafety] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await facilityApi.createReview(facility.id, {
        rating,
        cleanliness,
        accessibility,
        safety,
        comment: comment.trim() || undefined
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onReviewSubmitted) onReviewSubmitted();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarSelector = (
    label: string, 
    value: number, 
    onChange: (val: number) => void,
    description: string
  ) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {label}
        </label>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>
          {value}.0 ★
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: star <= value ? '#F59E0B' : '#D1D5DB',
              transition: 'transform 0.1s'
            }}
          >
            <Star size={24} fill={star <= value ? '#F59E0B' : 'none'} />
          </button>
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
          {description}
        </span>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 500, borderRadius: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Rate & Review Spot
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              {facility.name} • {facility.zone}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Check size={28} />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>
              Thank You for Contributing!
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Your feedback helps fellow riders stay safe and discover reliable roadside facilities.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
              padding: '6px 12px',
              backgroundColor: '#EFF6FF',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              <Sparkles size={14} /> +5 Contribution Points Earned
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12,
                marginBottom: 12
              }}>
                {error}
              </div>
            )}

            {/* Overall Rating */}
            {renderStarSelector('Overall Quality', rating, setRating, 'Overall experience')}

            {/* Sub-ratings */}
            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 14
            }}>
              {renderStarSelector('Cleanliness', cleanliness, setCleanliness, 'Sanitation & water')}
              {renderStarSelector('Accessibility', accessibility, setAccessibility, '2W parking & approach')}
              {renderStarSelector('Safety & Lighting', safety, setSafety, 'Night safety & area')}
            </div>

            {/* Review Comment */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 12 }}>
                Short Note / Rider Tip (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="E.g., Drinking water tap was working and parking was free for riders."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={300}
                style={{ fontSize: 13 }}
              />
            </div>

            {/* Contributor badge notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              backgroundColor: '#F0FDF4',
              borderRadius: 8,
              border: '1px solid #BBF7D0',
              marginBottom: 16,
              fontSize: 12,
              color: '#166534'
            }}>
              <ShieldCheck size={16} />
              <span>Reviewing grants <strong>+5 points</strong> to your OIVU Worker Trust Score.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
                {submitting ? 'Submitting...' : 'Submit Rating (+5 pts)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
