import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Filter, MapPin, CheckCircle, Sliders, 
  RotateCcw, RefreshCw, Bookmark, PlusCircle, AlertTriangle,
  Play, Pause, Crosshair, ArrowRight, ShieldAlert, Sparkles, X, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { Facility } from '../types';
import { facilityApi, breakApi } from '../services/api';
import { searchLocalities, LocalityResult, PRESET_CORRIDORS } from '../services/geocodeService';
import { InteractiveMap } from '../components/InteractiveMap';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityDetailModal } from '../components/FacilityDetailModal';
import { ReportModal } from '../components/ReportModal';

export const ExplorePage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Locality Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocalityResult[]>([]);
  const [isSearchingLocality, setIsSearchingLocality] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);
  const [searchMessage, setSearchMessage] = useState<string>('');
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);
  
  const { 
    location, 
    isTracking, 
    startTracking, 
    stopTracking, 
    refreshLocation, 
    setManualLocation, 
    clearManualLocation, 
    permissionGranted 
  } = useLocation();
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoSeedMessage, setDemoSeedMessage] = useState<string | null>(null);

  // Effective coordinates for nearby discovery (User GPS or Manual Locality)
  const effectiveLat = location.lat ?? 11.0267;
  const effectiveLng = location.lng ?? 77.0118;

  // Debounced search query for locality geocoding
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocality(true);
      try {
        const results = await searchLocalities(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('Locality search error', err);
      } finally {
        setIsSearchingLocality(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load nearby facilities from backend using real coordinates
  const loadFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        lat: effectiveLat,
        lng: effectiveLng,
        initialRadius: 5,
        step: 1,
        minResults: 5,
        maxRadius: 20
      };
      
      if (selectedCategories.length > 0) {
        params.category = selectedCategories.join(',');
      }
      
      const res = await facilityApi.getNearbyFacilities(params);
      
      setFacilities(res.facilities);
      setSearchRadiusKm(res.searchRadiusKm);
      setSearchMessage(res.message);
      
      if (res.facilities.length > 0 && !selectedFacility) {
        setSelectedFacility(res.facilities[0]);
      }
    } catch (err: any) {
      console.error('Failed to load facilities', err);
      setSearchMessage('Could not retrieve nearby facilities. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [effectiveLat, effectiveLng, selectedCategories]);

  const handleSeedDemoNearMe = async () => {
    try {
      setSeedingDemo(true);
      setDemoSeedMessage(null);
      const res = await facilityApi.seedDemoFacilities(effectiveLat, effectiveLng, 'Jury Evaluation Zone');
      setDemoSeedMessage(res.message);
      await loadFacilities();
      setTimeout(() => setDemoSeedMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo facilities');
    } finally {
      setSeedingDemo(false);
    }
  };

  // Refresh facilities when coordinates or category filters change
  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const handleSelectLocality = (loc: LocalityResult) => {
    setManualLocation(loc.lat, loc.lng, loc.shortName);
    setSearchQuery(loc.shortName);
    setShowDropdown(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    clearManualLocation();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleBookmarkToggle = async (facilityId: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await breakApi.toggleBookmark(facilityId);
      setFacilities((prev) =>
        prev.map((f) =>
          f.id === facilityId ? { ...f, is_bookmarked: res.bookmarked } : f
        )
      );
    } catch (err: any) {
      alert(err.message || 'Bookmark update failed');
    }
  };

  // Helper for tracking status badge
  const renderTrackingBadge = () => {
    if (location.isManualSearch) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D97706' }}></span>
          <span>📍 Searched: {location.manualLocationName}</span>
          <button 
            onClick={clearManualLocation}
            style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: '#B45309',
              cursor: 'pointer',
              marginLeft: 4
            }}
          >
            Revert to Live GPS
          </button>
        </div>
      );
    }

    if (location.trackingStatus === 'ACTIVE') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse 1.5s infinite' }}></span>
          <span>Live GPS Active {location.accuracy ? `(±${location.accuracy}m)` : ''}</span>
        </div>
      );
    }

    if (location.trackingStatus === 'PAUSED') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#9CA3AF' }}></span>
          <span>Tracking Paused</span>
        </div>
      );
    }

    if (location.trackingStatus === 'DENIED') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
          <span>GPS Denied — Use Locality Search</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4B5563' }}>
        <RefreshCw size={12} className="spin" />
        <span>Locating...</span>
      </div>
    );
  };

  // Check if no dedicated rest hubs exist, but other facilities might be present (Issue #5 § 10)
  const isDedicatedRestHubFilter = selectedCategories.includes('REST_POINT');
  const hasNoDedicatedRestHub = isDedicatedRestHubFilter && facilities.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Top Header: Search & Live Tracking Bar */}
      <div style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', zIndex: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        
        {/* Locality Search Input with Autocomplete */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input
                type="text"
                className="form-input"
                style={{ 
                  paddingLeft: 38, 
                  paddingRight: searchQuery ? 32 : 12,
                  borderRadius: 20, 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--surface-subtle)', 
                  height: 40,
                  fontSize: 14
                }}
                placeholder="Search corridor or locality (e.g. Peelamedu, Gandhipuram, OMR)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                    clearManualLocation();
                  }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 11,
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                if (isTracking) stopTracking();
                else startTracking();
              }}
              title={isTracking ? 'Pause GPS tracking' : 'Resume live GPS tracking'}
              className="btn btn-secondary"
              style={{ borderRadius: 20, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              {isTracking ? <Pause size={15} /> : <Play size={15} />}
              <span style={{ display: 'none' }} className="sm:inline">
                {isTracking ? 'Pause GPS' : 'Resume GPS'}
              </span>
            </button>

            <button 
              onClick={refreshLocation}
              title="Refresh nearby rest facilities"
              className="btn btn-secondary"
              style={{ borderRadius: 20, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Locality Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '1px solid var(--border)',
              zIndex: 1000,
              maxHeight: 240,
              overflowY: 'auto'
            }}>
              {searchResults.map((loc, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectLocality(loc)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: idx < searchResults.length - 1 ? '1px solid #F1F5F9' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={16} color={loc.type === 'local_preset' ? '#2563EB' : '#64748B'} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>{loc.shortName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{loc.displayName}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 8,
                    backgroundColor: loc.type === 'local_preset' ? '#EFF6FF' : '#F1F5F9',
                    color: loc.type === 'local_preset' ? '#2563EB' : '#475569'
                  }}>
                    {loc.type === 'local_preset' ? 'Corridor Hub' : 'OSM'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tracking Status & Last Updated Timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {renderTrackingBadge()}

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {location.lastUpdated 
              ? `Last updated ${location.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` 
              : 'Acquiring position...'}
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 2 }} className="hide-scrollbar">
          {[
            { id: 'WASHROOM', label: '🚻 Washroom' },
            { id: 'WATER', label: '💧 Water' },
            { id: 'REST_POINT', label: '🌳 Rest Seating' },
            { id: 'CHARGING', label: '🔋 Charging' },
            { id: 'FOOD', label: '🍱 Food' },
            { id: 'PETROL_PUMP', label: '⛽ Petrol Pump' }
          ].map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '5px 12px',
                  borderRadius: 18,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                  color: isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {cat.label}
              </button>
            );
          })}

          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              style={{
                whiteSpace: 'nowrap',
                padding: '5px 10px',
                borderRadius: 18,
                fontSize: 12,
                fontWeight: 600,
                border: '1px dashed var(--border)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Jury / Evaluation Demo Mode Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
            <MapPin size={14} color="var(--primary)" />
            <span>
              Location: <strong>{location.isManualSearch ? (location.manualLocationName || 'Selected Locality') : 'My Live GPS'}</strong> ({effectiveLat.toFixed(4)}, {effectiveLng.toFixed(4)})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                if (location.isManualSearch) {
                  clearManualLocation();
                } else {
                  handleSelectLocality(PRESET_CORRIDORS[0]);
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: '4px 10px' }}
              title="Toggle between your live GPS and Coimbatore's pre-configured corridor"
            >
              {location.isManualSearch ? '📍 Switch to My Real GPS' : '🏢 View Coimbatore Corridor'}
            </button>
            <button
              type="button"
              onClick={handleSeedDemoNearMe}
              disabled={seedingDemo}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11, padding: '4px 10px' }}
              title="Add 5 verified demo rest points around current map coordinates"
            >
              <PlusCircle size={13} />
              <span>{seedingDemo ? 'Creating...' : '+ Add Demo Hubs Here'}</span>
            </button>
          </div>
        </div>

        {demoSeedMessage && (
          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#047857',
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <CheckCircle size={14} />
            <span>{demoSeedMessage}</span>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Search Radius & Count Overlay */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '6px 16px',
          borderRadius: 20,
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0,0,0,0.06)',
          maxWidth: '92%',
          width: 'max-content'
        }}>
          {loading ? (
            <>
              <RefreshCw size={14} className="spin" color="var(--primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Scanning corridor...
              </span>
            </>
          ) : (
            <>
              {facilities.length > 0 ? (
                <CheckCircle size={14} color="var(--success)" />
              ) : (
                <AlertTriangle size={14} color="var(--warning)" />
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {searchMessage || `${facilities.length} rest facilities discovered`}
              </span>
            </>
          )}
        </div>

        {/* Location Error Guidance Banner if GPS is blocked */}
        {!permissionGranted && location.error && !location.isManualSearch && (
          <div style={{
            position: 'absolute',
            top: 56,
            left: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '10px 14px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontSize: 13 }}>
              <MapPin size={16} />
              <span>{location.error}</span>
            </div>
            <button
              onClick={() => handleSelectLocality(PRESET_CORRIDORS[0])}
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0, fontSize: 11 }}
            >
              Use Peelamedu Default
            </button>
          </div>
        )}

        {/* Map View */}
        <div style={{ flex: 1, width: '100%', height: '100%' }}>
          <InteractiveMap
            facilities={facilities}
            selectedFacility={selectedFacility}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
            userLat={location.lat}
            userLng={location.lng}
            accuracy={location.accuracy}
            searchRadiusKm={searchRadiusKm}
            height="100%"
            isManualSearch={location.isManualSearch}
            manualLocationName={location.manualLocationName}
            onRecenter={clearManualLocation}
          />
        </div>

        {/* Fallback Experience When No Dedicated Rest Hub Exists (Issue #5 § 10) */}
        {!loading && hasNoDedicatedRestHub && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            padding: '20px 24px',
            borderRadius: 16,
            boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
            textAlign: 'center',
            width: '90%',
            maxWidth: 360,
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⛱️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>
              No dedicated rest hub nearby
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.4 }}>
              No specialized gig worker oasis was found within {searchRadiusKm} km. You can still discover shaded spots, water points, or washrooms.
            </p>

            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11,
              color: '#1E40AF',
              marginBottom: 14,
              textAlign: 'left'
            }}>
              ℹ️ <strong>Rest Suitability Guide:</strong> Tree shade and petrol pump bays are suitable for a short 10-minute hydration pause. Always confirm local access rules.
            </div>

            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }} 
              onClick={() => setSelectedCategories([])}
            >
              View All Nearby Facilities
            </button>
          </div>
        )}

        {/* Complete Empty State if 0 facilities of any kind */}
        {!loading && facilities.length === 0 && !hasNoDedicatedRestHub && (
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            padding: '20px 24px',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            textAlign: 'center',
            maxWidth: 360,
            width: '90%',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <MapPin size={26} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Rest Hubs Near Here</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              No rest points found within {searchRadiusKm} km of coordinates ({effectiveLat.toFixed(3)}, {effectiveLng.toFixed(3)}).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleSeedDemoNearMe}
                disabled={seedingDemo}
                className="btn btn-primary btn-sm"
                style={{ justifyContent: 'center', padding: '10px 14px' }}
              >
                <PlusCircle size={15} />
                <span>{seedingDemo ? 'Generating...' : '📍 Add 5 Demo Rest Hubs Here'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLocality(PRESET_CORRIDORS[0])}
                className="btn btn-outline btn-sm"
                style={{ justifyContent: 'center' }}
              >
                <span>🏢 Switch to Coimbatore Corridor</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center' }}
                onClick={handleResetFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Facility Cards at Bottom */}
        {facilities.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            width: '100%',
            zIndex: 1000,
            overflowX: 'auto',
            display: 'flex',
            gap: 14,
            padding: '0 16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} className="hide-scrollbar">
            {facilities.map((facility) => (
              <div 
                key={facility.id} 
                style={{ 
                  minWidth: 290, 
                  maxWidth: 310,
                  flexShrink: 0,
                  opacity: selectedFacility?.id === facility.id ? 1 : 0.9,
                  transform: selectedFacility?.id === facility.id ? 'scale(1.02)' : 'scale(0.98)',
                  transition: 'all 0.2s ease-out'
                }}
                onClick={() => setSelectedFacility(facility)}
              >
                <FacilityCard
                  facility={facility}
                  onSelect={(fac) => setSelectedFacility(fac)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onReportClick={(fac) => setReportFacility(fac)}
                  userLat={location.lat}
                  userLng={location.lng}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <FacilityDetailModal
        facility={selectedFacility}
        allFacilities={facilities}
        isOpen={!!selectedFacility}
        onClose={() => setSelectedFacility(null)}
        onSelectFacility={(fac) => setSelectedFacility(fac)}
        onOpenReport={(fac) => {
          setSelectedFacility(null);
          setReportFacility(fac);
        }}
        onBookmarkToggle={handleBookmarkToggle}
        onFacilityUpdated={loadFacilities}
      />

      <ReportModal
        facility={reportFacility}
        isOpen={!!reportFacility}
        onClose={() => setReportFacility(null)}
        onSuccess={loadFacilities}
      />
    </div>
  );
};
