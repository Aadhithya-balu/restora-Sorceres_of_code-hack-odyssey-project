import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MapPin, CheckCircle, Sliders, 
  RotateCcw, RefreshCw, Bookmark, PlusCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAccessType, setSelectedAccessType] = useState<string>('ALL');
  const [selectedAmenity, setSelectedAmenity] = useState<string>('ALL');
  
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);
  
  const userLat = 11.0267;
  const userLng = 77.0118;

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const params: any = {
        lat: userLat,
        lng: userLng
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedAccessType !== 'ALL') params.access_type = selectedAccessType;
      if (selectedAmenity !== 'ALL') params.service = selectedAmenity;

      const data = await facilityApi.getFacilities(params);
      setFacilities(data);
      if (data.length > 0 && !selectedFacility) {
        setSelectedFacility(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load facilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [selectedCategory, selectedAccessType, selectedAmenity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFacilities();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedAccessType('ALL');
    setSelectedAmenity('ALL');
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
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Search Bar */}
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>Explore Rest Points & Safe Hubs</h1>
        <p style={{ fontSize: 14 }}>
          Verified facilities with drinking water, washrooms, charging, and parking in Coimbatore & Peelamedu.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by facility name, road (Avinashi Rd), or zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>

          {(searchQuery || selectedCategory !== 'ALL' || selectedAccessType !== 'ALL' || selectedAmenity !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              title="Reset all filters"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </form>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Category:</span>
          {['ALL', 'PETROL_PUMP', 'PUBLIC_REST_POINT', 'PARTNER_CAFE', 'TRANSIT_STATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`badge ${selectedCategory === cat ? 'badge-verified' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', padding: '5px 10px', fontSize: 11 }}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, marginTop: 10 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Amenity:</span>
          {[
            { id: 'ALL', label: 'All Amenities' },
            { id: 'water', label: '💧 Water' },
            { id: 'washroom', label: '🚻 Washroom' },
            { id: 'charging', label: '⚡ Charging' },
            { id: 'rest', label: '🪑 Seating' },
            { id: 'shade', label: '⛱️ Shade' },
            { id: 'medical', label: '🩹 First Aid' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedAmenity(item.id)}
              className={`badge ${selectedAmenity === item.id ? 'badge-pending' : 'badge-neutral'}`}
              style={{ cursor: 'pointer', padding: '5px 10px', fontSize: 11 }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <InteractiveMap
        facilities={facilities}
        selectedFacility={selectedFacility}
        onSelectFacility={(fac) => setSelectedFacility(fac)}
        userLat={userLat}
        userLng={userLng}
        height="380px"
      />

      {/* Facilities Result Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>
            Available Rest Points ({facilities.length})
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Sorted by proximity to your current location
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 8 }} />
            <div>Loading verified rest points...</div>
          </div>
        ) : facilities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p>No rest points match your selected search or amenity filters.</p>
            <button onClick={handleResetFilters} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-3">
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                onSelect={(fac) => setSelectedFacility(fac)}
                onBookmarkToggle={handleBookmarkToggle}
                onReportClick={(fac) => setReportFacility(fac)}
              />
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
