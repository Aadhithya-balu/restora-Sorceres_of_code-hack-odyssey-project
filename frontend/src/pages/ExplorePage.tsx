import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, CheckCircle, Sliders, 
  RotateCcw, RefreshCw, Bookmark, PlusCircle, AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { Facility } from '../types';
import { facilityApi, breakApi } from '../services/api';
import { InteractiveMap } from '../components/InteractiveMap';
import { FacilityCard } from '../components/FacilityCard';
import { FacilityDetailModal } from '../components/FacilityDetailModal';
import { ReportModal } from '../components/ReportModal';

export const ExplorePage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(5);
  const [searchMessage, setSearchMessage] = useState<string>('');
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);
  
  const { location, permissionGranted } = useLocation();
  const userLat = location.lat ?? 11.0267;
  const userLng = location.lng ?? 77.0118;

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const params: any = {
        lat: userLat,
        lng: userLng,
        initialRadius: 5,
        step: 1,
        minResults: 5,
        maxRadius: 20
      };
      
      if (selectedCategories.length > 0) params.category = selectedCategories.join(',');
      if (selectedAmenities.length > 0) params.service = selectedAmenities.join(',');
      // Note: adaptive search backend might not support free-text 'q' directly in the same way, but we can pass it if supported.
      
      const res = await facilityApi.getNearbyFacilities(params);
      
      // If we have local search query, filter client-side just in case
      let finalFacilities = res.facilities;
      if (searchQuery.trim()) {
        const sq = searchQuery.toLowerCase();
        finalFacilities = finalFacilities.filter(f => 
          f.name.toLowerCase().includes(sq) || 
          f.address.toLowerCase().includes(sq) || 
          f.zone.toLowerCase().includes(sq)
        );
      }
      
      setFacilities(finalFacilities);
      setSearchRadiusKm(res.searchRadiusKm);
      setSearchMessage(res.message);
      
      if (finalFacilities.length > 0 && !selectedFacility) {
        setSelectedFacility(finalFacilities[0]);
      }
    } catch (err: any) {
      console.error('Failed to load facilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [selectedCategories, selectedAmenities, userLat, userLng]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFacilities();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedAmenities([]);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Search & Filter Area */}
      <div style={{ padding: '12px 16px', backgroundColor: 'var(--surface)', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 10 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38, borderRadius: 20, border: '1px solid var(--border)', backgroundColor: 'var(--surface-subtle)', height: 40 }}
              placeholder="Search washroom, water, rest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 20, padding: '0 16px' }}>
            Search
          </button>
        </form>

        {/* Scrollable Filter Chips */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: 8, paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
          {[
            { id: 'WASHROOM', label: '🚻 Washroom' },
            { id: 'WATER', label: '💧 Water' },
            { id: 'REST_POINT', label: '🌳 Rest' },
            { id: 'CHARGING', label: '🔋 Charging' },
            { id: 'FOOD', label: '🍱 Food' }
          ].map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                  color: isSelected ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Area */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Search Status Overlay */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 16px',
          borderRadius: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0,0,0,0.05)',
          maxWidth: '90%',
          width: 'max-content'
        }}>
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" color="var(--primary)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Expanding search...</span>
            </>
          ) : (
            <>
              {facilities.length > 0 ? <CheckCircle size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--warning)" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {searchMessage || `${facilities.length} facilities found`}
              </span>
            </>
          )}
        </div>

        {/* Location Error State */}
        {!permissionGranted && location.error && (
          <div style={{
            position: 'absolute',
            top: 70,
            left: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            padding: '12px',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B91C1C', fontWeight: 600, fontSize: 14 }}>
              <MapPin size={18} /> Location access is needed
            </div>
            <p style={{ fontSize: 13, color: '#991B1B', margin: 0 }}>Please enable location services to find accurate nearby facilities.</p>
          </div>
        )}

        <div style={{ flex: 1, width: '100%' }}>
          <InteractiveMap
            facilities={facilities}
            selectedFacility={selectedFacility}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
            userLat={location.lat}
            userLng={location.lng}
            searchRadiusKm={searchRadiusKm}
            height="100%"
          />
        </div>

        {/* Empty State Overlay */}
        {!loading && facilities.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'var(--surface)',
            padding: 24,
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            textAlign: 'center',
            width: 280
          }}>
            <MapPin size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>No facilities found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              We couldn't find a suitable facility within {searchRadiusKm} km.
            </p>
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={handleResetFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Horizontal Scrollable Facility Cards at Bottom */}
        {facilities.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: '100%',
            zIndex: 1000,
            overflowX: 'auto',
            display: 'flex',
            gap: 16,
            padding: '0 16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }} className="hide-scrollbar">
            {facilities.map((facility) => (
              <div 
                key={facility.id} 
                style={{ 
                  minWidth: 300, 
                  maxWidth: 320,
                  flexShrink: 0,
                  opacity: selectedFacility?.id === facility.id ? 1 : 0.9,
                  transform: selectedFacility?.id === facility.id ? 'scale(1)' : 'scale(0.98)',
                  transition: 'all 0.2s ease-out'
                }}
                onClick={() => setSelectedFacility(facility)}
              >
                <FacilityCard
                  facility={facility}
                  onSelect={(fac) => setSelectedFacility(fac)}
                  onBookmarkToggle={handleBookmarkToggle}
                  onReportClick={(fac) => setReportFacility(fac)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <FacilityDetailModal
        facility={selectedFacility}
        isOpen={!!selectedFacility}
        onClose={() => setSelectedFacility(null)}
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
