import React, { useState, useEffect } from 'react';
import { 
  Heart, Shield, Phone, ExternalLink, Gift, 
  MapPin, Clock, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { SupportResource, PartnerOffer } from '../types';
import { supportApi } from '../services/api';

export const SupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resources' | 'offers'>('resources');
  const [resourceCategory, setResourceCategory] = useState<string>('ALL');
  const [resources, setResources] = useState<SupportResource[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resList, offerList] = await Promise.all([
        supportApi.getSupportResources(resourceCategory),
        supportApi.getPartnerOffers()
      ]);
      setResources(resList);
      setOffers(offerList);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resourceCategory]);

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Heart size={24} color="var(--danger)" />
          <h1 style={{ fontSize: 24 }}>Worker Welfare, Emergency & Partner Benefits</h1>
        </div>
        <p style={{ fontSize: 14 }}>
          Essential government welfare board contacts, clinic emergency lines, and partner store discounts for registered gig workers.
        </p>
      </div>

      {/* Main Switcher (Resources vs Partner Offers) */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('resources')}
          className={`btn ${activeTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Shield size={16} /> Welfare Boards & Emergency Resources
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`btn ${activeTab === 'offers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Gift size={16} /> Partner Offers & Food Discounts ({offers.length})
        </button>
      </div>

      {/* Welfare Resources Section */}
      {activeTab === 'resources' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Sub-category Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Resources' },
              { id: 'WELFARE_BOARD', label: '🏛️ Welfare Boards' },
              { id: 'EMERGENCY_CONTACT', label: '🚨 Emergency Helplines' },
              { id: 'CLINIC_PARTNER', label: '🏥 Clinic Partners' },
              { id: 'HEALTH_GUIDELINE', label: '🩺 Health Guidelines' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setResourceCategory(cat.id)}
                className={`badge ${resourceCategory === cat.id ? 'badge-verified' : 'badge-neutral'}`}
                style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading support resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              No resources found for this category.
            </div>
          ) : (
            <div className="grid grid-2">
              {resources.map((item) => (
                <div key={item.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-neutral" style={{ fontSize: 10, marginBottom: 4 }}>
                        {item.category.replace(/_/g, ' ')}
                      </span>
                      <h3 style={{ fontSize: 16 }}>{item.title}</h3>
                    </div>
                    {item.is_verified && (
                      <span className="badge badge-verified">
                        <CheckCircle size={11} /> Verified
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>

                  {item.address && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} /> {item.address}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 10,
                    marginTop: 6
                  }}>
                    {item.contact_number ? (
                      <a
                        href={`tel:${item.contact_number}`}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                      >
                        <Phone size={13} /> Call {item.contact_number}
                      </a>
                    ) : <div />}

                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        Official Portal <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner Offers Section */}
      {activeTab === 'offers' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading partner discounts...
            </div>
          ) : offers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              No active partner offers right now. Check back soon!
            </div>
          ) : (
            <div className="grid grid-3">
              {offers.map((offer) => (
                <div key={offer.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-pending" style={{ fontSize: 10, marginBottom: 4 }}>
                        {offer.offer_type.replace(/_/g, ' ')}
                      </span>
                      <h3 style={{ fontSize: 16 }}>{offer.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        Partner: {offer.partner_name}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                    {offer.description}
                  </p>

                  <div style={{
                    backgroundColor: 'var(--surface-subtle)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    color: 'var(--text-secondary)'
                  }}>
                    <strong>Terms: </strong>{offer.terms}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto' }}>
                    Valid until: {new Date(offer.valid_until).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
