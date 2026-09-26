import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Filter, MapPin, CheckCircle, Sliders, 
  RotateCcw, RefreshCw, Bookmark, PlusCircle, AlertTriangle,
  Play, Pause, Crosshair, ArrowRight, ShieldAlert, Sparkles, X, Info,
  LayoutGrid, List
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
import { RestPointAIAssistantModal } from '../components/RestPointAIAssistantModal';
import { AddSpotModal } from '../components/AddSpotModal';

interface ExplorePageProps {
  onOpenAddSpot?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onOpenAddSpot }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  
  // Locality Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocalityResult[]>([]);
  const [isSearchingLocality, setIsSearchingLocality] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);
  const [searchMessage, setSearchMessage] = useState<string>('');
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'grid' | 'row'>('grid');
  const [mapViewMode, setMapViewMode] = useState<'standard' | 'tall' | 'split'>('standard');
  const toggleTallMap = () => {
    setMapViewMode(prev => prev === 'tall' ? 'standard' : 'tall');
  };
  
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

  // Read initial category filter from URL query or hash params (e.g. ?category=WASHROOM)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashQuery);
      const catParam = searchParams.get('category') || hashParams.get('category');
      if (catParam) {
        setSelectedCategories([catParam.toUpperCase()]);
      }
    }
  }, []);

  const handleOpenAddSpot = () => {
    if (onOpenAddSpot) {
      onOpenAddSpot();
    } else {
      setShowAddSpotModal(true);
    }
  };

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
      
      // Explicit deep-link support: only select if URL query explicitly requested a facility (e.g. ?facility=123 or #explore?facility=123)
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
        const hashParams = new URLSearchParams(hashQuery);
        const requestedId = searchParams.get('facility') || hashParams.get('facility');
        if (requestedId) {
          const match = res.facilities.find(f => f.id === Number(requestedId));
          if (match && (!selectedFacility || selectedFacility.id !== match.id)) {
            setSelectedFacility(match);
            setDetailFacility(match);
          }
        }
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

  const handleSelectFacility = (fac: Facility | null) => {
    if (!fac) {
      setSelectedFacility(null);
      return;
    }
    if (selectedFacility?.id === fac.id) {
      // Clicking the already selected card or pin again deselects it (toggle off)
      setSelectedFacility(null);
      return;
    }
    setSelectedFacility(fac);
    const cardEl = document.getElementById(`facility-card-${fac.id}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Escape key deselects currently selected facility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFacility && !detailFacility && !reportFacility) {
        setSelectedFacility(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFacility, detailFacility, reportFacility]);

  const handleSelectLocality = (loc: LocalityResult) => {
    setManualLocation(loc.lat, loc.lng, loc.shortName);
    setSearchQuery(loc.shortName);
    setShowDropdown(false);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setSelectedFacility(null);
    setDetailFacility(null);
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-main)' }}>
      
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

            {/* Map View Mode Switcher (Standard 68vh, Tall 85vh, Split Side-by-Side) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-subtle)',
              padding: 2,
              borderRadius: 20,
              border: '1px solid var(--border)',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setMapViewMode('standard')}
                style={{
                  padding: '5px 11px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: mapViewMode === 'standard' ? 700 : 500,
                  backgroundColor: mapViewMode === 'standard' ? '#FFFFFF' : 'transparent',
                  color: mapViewMode === 'standard' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: mapViewMode === 'standard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Standard balanced map height (68vh)"
              >
                <span>📐 Standard</span>
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('tall')}
                style={{
                  padding: '5px 11px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: mapViewMode === 'tall' ? 700 : 500,
                  backgroundColor: mapViewMode === 'tall' ? '#FFFFFF' : 'transparent',
                  color: mapViewMode === 'tall' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: mapViewMode === 'tall' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Expansive tall map view (85vh)"
              >
                <span>🧭 Tall</span>
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode('split')}
                className="hide-on-mobile"
                style={{
                  padding: '5px 11px',
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: mapViewMode === 'split' ? 700 : 500,
                  backgroundColor: mapViewMode === 'split' ? '#FFFFFF' : 'transparent',
                  color: mapViewMode === 'split' ? 'var(--primary)' : 'var(--text-secondary)',
                  border: 'none',
                  boxShadow: mapViewMode === 'split' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Desktop side-by-side list and map"
              >
                <span>◫ Split View</span>
              </button>
            </div>
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

        {/* Filter Chips & AI Assistant Entry */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 2, alignItems: 'center' }} className="hide-scrollbar">
          {/* Ask RESTORA AI Button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 13px',
              borderRadius: 18,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)',
              transition: 'all 0.15s',
              flexShrink: 0
            }}
          >
            <Sparkles size={14} /> Ask RESTORA AI
          </button>
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
            <button
              type="button"
              onClick={handleOpenAddSpot}
              className="btn btn-primary btn-sm"
              style={{ fontSize: 11, padding: '4px 10px', fontWeight: 700, backgroundColor: '#0D9488' }}
              title="Add a new spot to earn +15 reputation points"
            >
              <PlusCircle size={13} />
              <span>+ Add Spot (+15 pts)</span>
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

      {/* Map & Facilities Modular Renders */}
      {(() => {
        const renderMapWrapper = () => (
          <>
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
              width: 'max-content',
              pointerEvents: 'none'
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
            <InteractiveMap
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={handleSelectFacility}
              onOpenDetails={setDetailFacility}
              userLat={location.lat}
              userLng={location.lng}
              accuracy={location.accuracy}
              searchRadiusKm={searchRadiusKm}
              height="100%"
              isManualSearch={location.isManualSearch}
              manualLocationName={location.manualLocationName}
              onRecenter={clearManualLocation}
              onToggleHeightMode={toggleTallMap}
              isTallMode={mapViewMode === 'tall'}
            />
          </>
        );

        const renderFacilitiesContent = (isSplitSidebar = false) => (
          <>
            {/* Section Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: isSplitSidebar ? 18 : 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Nearby Rest Facilities
                  </h2>
                  <span className="badge badge-verified" style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12 }}>
                    {facilities.length} Found
                  </span>
                </div>
                {!isSplitSidebar && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Verified resting points within <strong>{searchRadiusKm} km</strong> of your active coordinates. Click any card to highlight on map.
                  </p>
                )}

                {selectedFacility && (
                  <div style={{
                    marginTop: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid var(--primary-border)',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: 12,
                    color: 'var(--primary-dark)',
                    fontWeight: 600
                  }}>
                    <span>📍 Selected: <strong>{selectedFacility.name}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedFacility(null)}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--primary-border)',
                        borderRadius: 12,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--primary-dark)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Unselect and back to all facilities"
                    >
                      <X size={12} /> Clear / Back to All
                    </button>
                  </div>
                )}
              </div>

              {/* Controls: Add Spot & View Mode Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenAddSpot}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
                  title="Submit a new resting location (+15 pts)"
                >
                  <PlusCircle size={14} />
                  <span>+ Add Spot</span>
                </button>

                {!isSplitSidebar && facilities.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'var(--surface)',
                    padding: 4,
                    borderRadius: 10,
                    border: '1px solid var(--border)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setCardViewMode('grid')}
                      className={`btn btn-sm ${cardViewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 12px' }}
                      title="Display as responsive grid"
                    >
                      <LayoutGrid size={14} />
                      <span>Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardViewMode('row')}
                      className={`btn btn-sm ${cardViewMode === 'row' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 12px' }}
                      title="Display as scrollable row"
                    >
                      <List size={14} />
                      <span>Row</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fallback Experience When No Dedicated Rest Hub Exists */}
            {!loading && hasNoDedicatedRestHub && (
              <div style={{
                backgroundColor: 'var(--surface)',
                padding: '24px 28px',
                borderRadius: 16,
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                maxWidth: 480,
                margin: '0 auto 24px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⛱️</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>
                  No dedicated rest hub nearby
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.4 }}>
                  No specialized gig worker oasis was found within {searchRadiusKm} km. You can still discover shaded spots, water points, or washrooms.
                </p>

                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 12,
                  color: '#1E40AF',
                  marginBottom: 16,
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
                backgroundColor: 'var(--surface)',
                padding: '32px 24px',
                borderRadius: 16,
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                maxWidth: 420,
                margin: '20px auto 40px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}>
                  <MapPin size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No Rest Hubs Near Here</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
                  No rest points found within {searchRadiusKm} km of coordinates ({effectiveLat.toFixed(3)}, {effectiveLng.toFixed(3)}).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    onClick={handleOpenAddSpot}
                    className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'center', fontWeight: 700 }}
                  >
                    <PlusCircle size={15} />
                    <span>+ Submit a New Spot (+15 pts)</span>
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

            {/* Facility Cards */}
            {facilities.length > 0 && (
              <div
                className={
                  isSplitSidebar
                    ? 'explore-split-list'
                    : (cardViewMode === 'grid' ? 'explore-facilities-grid' : 'explore-facilities-row hide-scrollbar')
                }
                style={
                  isSplitSidebar
                    ? { display: 'flex', flexDirection: 'column', gap: 14 }
                    : (cardViewMode === 'grid' ? {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                        gap: 16
                      } : {
                        display: 'flex',
                        overflowX: 'auto',
                        gap: 16,
                        paddingBottom: 16,
                        scrollSnapType: 'x mandatory'
                      })
                }
              >
                {facilities.map((facility) => {
                  const isSelected = selectedFacility?.id === facility.id;
                  return (
                    <div
                      key={facility.id}
                      id={`facility-card-${facility.id}`}
                      style={(!isSplitSidebar && cardViewMode === 'row') ? {
                        minWidth: 320,
                        maxWidth: 360,
                        flexShrink: 0,
                        scrollSnapAlign: 'start'
                      } : {}}
                    >
                      <FacilityCard
                        facility={facility}
                        isSelected={isSelected}
                        onSelect={handleSelectFacility}
                        onOpenDetails={setDetailFacility}
                        onBookmarkToggle={handleBookmarkToggle}
                        onReportClick={(fac) => setReportFacility(fac)}
                        userLat={location.lat}
                        userLng={location.lng}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );

        if (mapViewMode === 'split') {
          return (
            <div className="explore-split-container">
              {/* Left Column: Scrollable Facilities List */}
              <div className="explore-split-sidebar">
                {renderFacilitiesContent(true)}
              </div>
              {/* Right Column: Full-Height Expansive Map */}
              <div className="explore-split-map">
                {renderMapWrapper()}
              </div>
            </div>
          );
        }

        return (
          <>
            {/* Map Area Container (Generous 68vh default, 85vh tall mode) */}
            <div className={`explore-map-wrapper ${mapViewMode === 'tall' ? 'map-tall' : ''}`}>
              {renderMapWrapper()}
            </div>

            {/* Dedicated "Nearby Facilities" / "Rest Points Near You" Section Below Map */}
            <section id="nearby-facilities" style={{
              padding: '24px 20px 48px',
              maxWidth: 1360,
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {renderFacilitiesContent(false)}
            </section>
          </>
        );
      })()}

      {/* Modals */}
      <FacilityDetailModal
        facility={detailFacility}
        allFacilities={facilities}
        isOpen={!!detailFacility}
        onClose={() => setDetailFacility(null)}
        onSelectFacility={(fac) => {
          handleSelectFacility(fac);
          setDetailFacility(fac);
        }}
        onOpenReport={(fac) => {
          setDetailFacility(null);
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

      <RestPointAIAssistantModal
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        userLat={effectiveLat}
        userLng={effectiveLng}
        onSelectFacility={(fac) => handleSelectFacility(fac)}
      />

      <AddSpotModal
        isOpen={showAddSpotModal}
        onClose={() => setShowAddSpotModal(false)}
        onSpotAdded={() => {
          loadFacilities();
        }}
      />
    </div>
  );
};
