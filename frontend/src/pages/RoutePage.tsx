import React, { useState } from 'react';
import { 
  Route as RouteIcon, MapPin, Navigation, Clock, 
  CheckCircle, ArrowRight, AlertCircle, Info, Sparkles, Sliders 
} from 'lucide-react';
import { RoutePlanResponse, RouteFacilityMatch, Facility } from '../types';
import { routeApi } from '../services/api';
import { FacilityDetailModal } from '../components/FacilityDetailModal';
import { ReportModal } from '../components/ReportModal';

// Popular delivery corridors in Coimbatore
const ROUTE_PRESETS = [
  {
    name: 'Gandhipuram Bus Stand ➔ TIDEL Park Peelamedu',
    origin_name: 'Gandhipuram Bus Terminal',
    origin_lat: 11.0168,
    origin_lng: 76.9676,
    dest_name: 'TIDEL Park IT Corridor',
    dest_lat: 11.0289,
    dest_lng: 77.0274
  },
  {
    name: 'Singanallur Junction ➔ Hope College Peelamedu',
    origin_name: 'Singanallur Trichy Road',
    origin_lat: 10.9998,
    origin_lng: 77.0234,
    dest_name: 'Hope College Peelamedu',
    dest_lat: 11.0315,
    dest_lng: 77.0162
  },
  {
    name: 'Coimbatore Railway Station ➔ CODISSIA Trade Center',
    origin_name: 'Coimbatore Junction',
    origin_lat: 10.9972,
    origin_lng: 76.9629,
    dest_name: 'CODISSIA Trade Fair Complex',
    dest_lat: 11.0381,
    dest_lng: 77.0298
  }
];

export const RoutePage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [originName, setOriginName] = useState(ROUTE_PRESETS[0].origin_name);
  const [originLat, setOriginLat] = useState(ROUTE_PRESETS[0].origin_lat);
  const [originLng, setOriginLng] = useState(ROUTE_PRESETS[0].origin_lng);
  
  const [destName, setDestName] = useState(ROUTE_PRESETS[0].dest_name);
  const [destLat, setDestLat] = useState(ROUTE_PRESETS[0].dest_lat);
  const [destLng, setDestLng] = useState(ROUTE_PRESETS[0].dest_lng);
  
  const [maxDetourKm, setMaxDetourKm] = useState(1.5);
  const [needWater, setNeedWater] = useState(true);
  const [needWashroom, setNeedWashroom] = useState(true);
  const [needCharging, setNeedCharging] = useState(false);
  const [needShade, setNeedShade] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<RoutePlanResponse | null>(null);
  
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index);
    const p = ROUTE_PRESETS[index];
    setOriginName(p.origin_name);
    setOriginLat(p.origin_lat);
    setOriginLng(p.origin_lng);
    setDestName(p.dest_name);
    setDestLat(p.dest_lat);
    setDestLng(p.dest_lng);
    setPlanResult(null);
  };

  const handlePlanRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requiredServices: string[] = [];
    if (needWater) requiredServices.push('water');
    if (needWashroom) requiredServices.push('washroom');
    if (needCharging) requiredServices.push('charging');
    if (needShade) requiredServices.push('shade');

    try {
      const res = await routeApi.planRoute({
        origin_name: originName,
        origin_lat: originLat,
        origin_lng: originLng,
        destination_name: destName,
        destination_lat: destLat,
        destination_lng: destLng,
        required_services: requiredServices,
        max_detour_km: maxDetourKm
      });
      setPlanResult(res);
    } catch (err: any) {
      setError(err.message || 'Route planning failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <RouteIcon size={24} color="var(--primary)" />
          <h1 style={{ fontSize: 24 }}>Rest-Aware Route Corridor Planning</h1>
        </div>
        <p style={{ fontSize: 14 }}>
          Find verified resting spots, washrooms, and water stops along your delivery journey with minimal detour distance.
        </p>
      </div>

      {/* Preset Route Selectors */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          Quick Delivery Corridors:
        </span>
        {ROUTE_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPreset(idx)}
            className={`btn btn-sm ${selectedPreset === idx ? 'btn-primary' : 'btn-secondary'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Route Input Form Card */}
      <form onSubmit={handlePlanRoute} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="grid grid-2">
          {/* Origin */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--primary)" /> Origin / Pickup Location
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Lat: {originLat.toFixed(4)}, Lng: {originLng.toFixed(4)}
            </div>
          </div>

          {/* Destination */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation size={14} color="var(--accent)" /> Destination / Delivery Drop
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Lat: {destLat.toFixed(4)}, Lng: {destLng.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Detour & Required Amenities */}
        <div style={{
          backgroundColor: 'var(--surface-subtle)',
          padding: 14,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Detour Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>
                <strong>Maximum Detour Tolerance:</strong> Rest stops within corridor
              </span>
              <strong style={{ color: 'var(--primary)' }}>{maxDetourKm} km</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.25"
              value={maxDetourKm}
              onChange={(e) => setMaxDetourKm(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>0.5 km (Direct corridor only)</span>
              <span>1.5 km (Balanced)</span>
              <span>3.0 km (Wider search)</span>
            </div>
          </div>

          {/* Required Service Checkboxes */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Must Have Along Route:</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={needWater}
                  onChange={(e) => setNeedWater(e.target.checked)}
                />
                💧 Free Drinking Water
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={needWashroom}
                  onChange={(e) => setNeedWashroom(e.target.checked)}
                />
                🚻 Washroom
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={needCharging}
                  onChange={(e) => setNeedCharging(e.target.checked)}
                />
                ⚡ Phone / EV Charging
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={needShade}
                  onChange={(e) => setNeedShade(e.target.checked)}
                />
                ⛱️ Shaded Parking
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Analyzing Route Corridor...' : (
              <>
                <Sparkles size={16} /> Find Corridor Rest Stops
              </>
            )}
          </button>
        </div>
      </form>

      {/* Route Results View */}
      {planResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Summary Box */}
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: 4 }}>
                  Corridor Analyzed
                </span>
                <h3 style={{ fontSize: 18 }}>
                  {planResult.origin} ➔ {planResult.destination}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 20, textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route Distance</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {planResult.total_route_distance_km.toFixed(1)} km
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Travel Time</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                    ~{planResult.estimated_travel_time_minutes} min
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithmic Honesty Disclaimer */}
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              backgroundColor: '#EFF6FF',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>{planResult.disclaimer}</span>
            </div>
          </div>

          {/* Matched Facilities on Corridor */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>
              Corridor Rest Point Matches ({planResult.facilities.length})
            </h3>

            {planResult.facilities.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
                <p>No rest points met your amenity requirements within a {maxDetourKm} km corridor detour.</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Try increasing your detour tolerance to 2.0 km or unchecking some amenity filters.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {planResult.facilities.map((match, i) => (
                  <div 
                    key={match.facility.id}
                    className="card card-hover"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 14
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {i + 1}
                        </span>
                        <h4 style={{ fontSize: 16 }}>{match.facility.name}</h4>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                          {match.facility.category.replace('_', ' ')}
                        </span>
                      </div>

                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        {match.facility.address}
                      </p>

                      <div style={{
                        backgroundColor: 'var(--surface-subtle)',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        display: 'inline-block'
                      }}>
                        💡 {match.stop_recommendation_reason}
                      </div>
                    </div>

                    {/* Detour stats and Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Corridor Detour</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>
                          +{match.estimated_corridor_detour_km.toFixed(1)} km
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          ({(match.straight_line_dist_km).toFixed(1)} km off-axis)
                        </div>
                      </div>

                      <button
                        onClick={() => setDetailFacility(match.facility)}
                        className="btn btn-primary btn-sm"
                      >
                        Stop Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <FacilityDetailModal
        facility={detailFacility}
        isOpen={!!detailFacility}
        onClose={() => setDetailFacility(null)}
        onOpenReport={(fac) => {
          setDetailFacility(null);
          setReportFacility(fac);
        }}
      />

      <ReportModal
        facility={reportFacility}
        isOpen={!!reportFacility}
        onClose={() => setReportFacility(null)}
        onSuccess={() => {}}
      />
    </div>
  );
};
