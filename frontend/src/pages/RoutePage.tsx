import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Route as RouteIcon, MapPin, Navigation, Clock, 
  CheckCircle, ArrowRight, AlertCircle, Info, Sparkles, Sliders,
  RefreshCw, Check, X
} from 'lucide-react';
import { RoutePlanResponse, RouteFacilityMatch, Facility } from '../types';
import { routeApi } from '../services/api';
import { searchLocalities, LocalityResult } from '../services/geocodeService';
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

// Human-readable detour distance formatting (avoids misleading "+0.0 km" for small values)
export function formatDetourDistance(detourKm: number): string {
  const meters = Math.round(detourKm * 1000);
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${detourKm.toFixed(1)} km`;
}

interface RouteInputSnapshot {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  requiredServices: string[];
  maxDetourKm: number;
}

export const RoutePage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  // Origin State
  const [originName, setOriginName] = useState(ROUTE_PRESETS[0].origin_name);
  const [originLat, setOriginLat] = useState<number | null>(ROUTE_PRESETS[0].origin_lat);
  const [originLng, setOriginLng] = useState<number | null>(ROUTE_PRESETS[0].origin_lng);
  const [originSelected, setOriginSelected] = useState<boolean>(true);
  const [originSuggestions, setOriginSuggestions] = useState<LocalityResult[]>([]);
  const [originSearching, setOriginSearching] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const originAbortRef = useRef<AbortController | null>(null);

  // Destination State
  const [destName, setDestName] = useState(ROUTE_PRESETS[0].dest_name);
  const [destLat, setDestLat] = useState<number | null>(ROUTE_PRESETS[0].dest_lat);
  const [destLng, setDestLng] = useState<number | null>(ROUTE_PRESETS[0].dest_lng);
  const [destSelected, setDestSelected] = useState<boolean>(true);
  const [destSuggestions, setDestSuggestions] = useState<LocalityResult[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destAbortRef = useRef<AbortController | null>(null);

  // Route Parameters
  const [maxDetourKm, setMaxDetourKm] = useState(1.5);
  const [needWater, setNeedWater] = useState(true);
  const [needWashroom, setNeedWashroom] = useState(true);
  const [needCharging, setNeedCharging] = useState(false);
  const [needShade, setNeedShade] = useState(false);

  // Execution State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planResult, setPlanResult] = useState<RoutePlanResponse | null>(null);
  const [lastCalculatedInputs, setLastCalculatedInputs] = useState<RouteInputSnapshot | null>(null);

  // Modals
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [reportFacility, setReportFacility] = useState<Facility | null>(null);

  // Origin Autocomplete (debounced 350ms with abortable cancellation)
  useEffect(() => {
    if (originSelected || !originName.trim() || originName.trim().length < 2) {
      setOriginSuggestions([]);
      setShowOriginDropdown(false);
      return;
    }

    if (originAbortRef.current) {
      originAbortRef.current.abort();
    }
    const controller = new AbortController();
    originAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setOriginSearching(true);
      try {
        const results = await searchLocalities(originName, controller.signal);
        setOriginSuggestions(results);
        setShowOriginDropdown(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Origin search error:', err);
        }
      } finally {
        setOriginSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [originName, originSelected]);

  // Destination Autocomplete (debounced 350ms with abortable cancellation)
  useEffect(() => {
    if (destSelected || !destName.trim() || destName.trim().length < 2) {
      setDestSuggestions([]);
      setShowDestDropdown(false);
      return;
    }

    if (destAbortRef.current) {
      destAbortRef.current.abort();
    }
    const controller = new AbortController();
    destAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setDestSearching(true);
      try {
        const results = await searchLocalities(destName, controller.signal);
        setDestSuggestions(results);
        setShowDestDropdown(true);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Destination search error:', err);
        }
      } finally {
        setDestSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destName, destSelected]);

  // Handle Quick Delivery Corridor Preset Click
  const handleSelectPreset = async (index: number) => {
    const p = ROUTE_PRESETS[index];
    setSelectedPreset(index);

    setOriginName(p.origin_name);
    setOriginLat(p.origin_lat);
    setOriginLng(p.origin_lng);
    setOriginSelected(true);
    setShowOriginDropdown(false);

    setDestName(p.dest_name);
    setDestLat(p.dest_lat);
    setDestLng(p.dest_lng);
    setDestSelected(true);
    setShowDestDropdown(false);

    setError(null);

    // Automatically calculate route for the selected preset
    executePlanRoute(
      p.origin_name,
      p.origin_lat,
      p.origin_lng,
      p.dest_name,
      p.dest_lat,
      p.dest_lng,
      maxDetourKm,
      getRequiredServices()
    );
  };

  const getRequiredServices = useCallback((): string[] => {
    const services: string[] = [];
    if (needWater) services.push('water');
    if (needWashroom) services.push('washroom');
    if (needCharging) services.push('charging');
    if (needShade) services.push('shade');
    return services;
  }, [needWater, needWashroom, needCharging, needShade]);

  // Execute Route Plan API Request
  const executePlanRoute = async (
    origName: string,
    origLat: number,
    origLng: number,
    dName: string,
    dLat: number,
    dLng: number,
    detourTolerance: number,
    reqServices: string[]
  ) => {
    // Coordinate validation
    if (origLat < -90 || origLat > 90 || origLng < -180 || origLng > 180) {
      setError('Origin coordinates are outside valid geographic bounds.');
      return;
    }
    if (dLat < -90 || dLat > 90 || dLng < -180 || dLng > 180) {
      setError('Destination coordinates are outside valid geographic bounds.');
      return;
    }

    // Identical location check
    if (Math.abs(origLat - dLat) < 0.00045 && Math.abs(origLng - dLng) < 0.00045) {
      setError('Origin and destination are the same location. Please choose a different delivery destination.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await routeApi.planRoute({
        origin_name: origName,
        origin_lat: origLat,
        origin_lng: origLng,
        destination_name: dName,
        destination_lat: dLat,
        destination_lng: dLng,
        required_services: reqServices,
        max_detour_km: detourTolerance
      });

      setPlanResult(res);
      setLastCalculatedInputs({
        originLat: origLat,
        originLng: origLng,
        destLat: dLat,
        destLng: dLng,
        requiredServices: [...reqServices],
        maxDetourKm: detourTolerance
      });
    } catch (err: any) {
      setError(err.message || 'Route corridor analysis failed. Please verify your selected points.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verify Origin is valid
    if (!originSelected || originLat === null || originLng === null) {
      setError('Please select a valid pickup location from the suggestions.');
      return;
    }

    // Verify Destination is valid
    if (!destSelected || destLat === null || destLng === null) {
      setError('Please select a valid delivery location from the suggestions.');
      return;
    }

    executePlanRoute(
      originName,
      originLat,
      originLng,
      destName,
      destLat,
      destLng,
      maxDetourKm,
      getRequiredServices()
    );
  };

  // Check if current inputs differ from the inputs that generated planResult (Stale Result Protection)
  const isResultStale = Boolean(
    planResult &&
    lastCalculatedInputs &&
    (
      originLat !== lastCalculatedInputs.originLat ||
      originLng !== lastCalculatedInputs.originLng ||
      destLat !== lastCalculatedInputs.destLat ||
      destLng !== lastCalculatedInputs.destLng ||
      maxDetourKm !== lastCalculatedInputs.maxDetourKm ||
      JSON.stringify(getRequiredServices().sort()) !== JSON.stringify(lastCalculatedInputs.requiredServices.sort())
    )
  );

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <RouteIcon size={24} color="var(--primary)" />
          <h1 style={{ fontSize: 24, margin: 0 }}>Rest-Aware Route Corridor Planning</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Discover verified resting points, clean washrooms, and water stops along your delivery journey with minimal detour overhead.
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
      <form onSubmit={handleFormSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="grid grid-2">
          
          {/* Origin Input with Autocomplete */}
          <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--primary)" /> Origin / Pickup Location
              </span>
              {originSelected && originLat !== null && (
                <span style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={12} /> Location Verified
                </span>
              )}
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                style={{
                  borderColor: !originSelected && originName ? '#F59E0B' : undefined,
                  paddingRight: originSearching ? 32 : 12
                }}
                placeholder="Type pickup place or area (e.g. Gandhipuram)..."
                value={originName}
                onChange={(e) => {
                  setOriginName(e.target.value);
                  setOriginSelected(false);
                  setOriginLat(null);
                  setOriginLng(null);
                  setSelectedPreset(null);
                  setError(null);
                }}
                onFocus={() => {
                  if (originSuggestions.length > 0 && !originSelected) {
                    setShowOriginDropdown(true);
                  }
                }}
              />
              {originSearching && (
                <RefreshCw size={14} className="spin" style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-muted)' }} />
              )}
            </div>

            {/* Origin Status / Coordinates */}
            <div style={{ fontSize: 11, marginTop: 4 }}>
              {originSelected && originLat !== null && originLng !== null ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  📍 Lat: {originLat.toFixed(4)}, Lng: {originLng.toFixed(4)}
                </span>
              ) : originName.trim() ? (
                <span style={{ color: '#D97706', fontWeight: 600 }}>
                  ⚠️ Select a matching location suggestion below
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Type at least 2 characters to search</span>
              )}
            </div>

            {/* Origin Autocomplete Dropdown */}
            {showOriginDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                border: '1px solid var(--border)',
                zIndex: 1000,
                maxHeight: 240,
                overflowY: 'auto'
              }}>
                {originSuggestions.length === 0 && !originSearching ? (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                    No locations found for "{originName}". Try another search term.
                  </div>
                ) : (
                  originSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setOriginName(item.shortName);
                        setOriginLat(item.lat);
                        setOriginLng(item.lng);
                        setOriginSelected(true);
                        setShowOriginDropdown(false);
                        setSelectedPreset(null);
                        setError(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: idx < originSuggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
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
                        <MapPin size={15} color={item.type === 'local_preset' ? '#2563EB' : '#64748B'} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B' }}>{item.shortName}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{item.displayName}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 8,
                        backgroundColor: item.type === 'local_preset' ? '#EFF6FF' : '#F1F5F9',
                        color: item.type === 'local_preset' ? '#2563EB' : '#475569'
                      }}>
                        {item.type === 'local_preset' ? 'Corridor' : 'Location'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Destination Input with Autocomplete */}
          <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Navigation size={14} color="var(--accent)" /> Destination / Delivery Drop
              </span>
              {destSelected && destLat !== null && (
                <span style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={12} /> Location Verified
                </span>
              )}
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                style={{
                  borderColor: !destSelected && destName ? '#F59E0B' : undefined,
                  paddingRight: destSearching ? 32 : 12
                }}
                placeholder="Type delivery destination (e.g. TIDEL Park, Srivilliputhur)..."
                value={destName}
                onChange={(e) => {
                  setDestName(e.target.value);
                  setDestSelected(false);
                  setDestLat(null);
                  setDestLng(null);
                  setSelectedPreset(null);
                  setError(null);
                }}
                onFocus={() => {
                  if (destSuggestions.length > 0 && !destSelected) {
                    setShowDestDropdown(true);
                  }
                }}
              />
              {destSearching && (
                <RefreshCw size={14} className="spin" style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-muted)' }} />
              )}
            </div>

            {/* Destination Status / Coordinates */}
            <div style={{ fontSize: 11, marginTop: 4 }}>
              {destSelected && destLat !== null && destLng !== null ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  📍 Lat: {destLat.toFixed(4)}, Lng: {destLng.toFixed(4)}
                </span>
              ) : destName.trim() ? (
                <span style={{ color: '#D97706', fontWeight: 600 }}>
                  ⚠️ Select a matching location suggestion below
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Type at least 2 characters to search</span>
              )}
            </div>

            {/* Destination Autocomplete Dropdown */}
            {showDestDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
                border: '1px solid var(--border)',
                zIndex: 1000,
                maxHeight: 240,
                overflowY: 'auto'
              }}>
                {destSuggestions.length === 0 && !destSearching ? (
                  <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                    No locations found for "{destName}". Try another search term.
                  </div>
                ) : (
                  destSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDestName(item.shortName);
                        setDestLat(item.lat);
                        setDestLng(item.lng);
                        setDestSelected(true);
                        setShowDestDropdown(false);
                        setSelectedPreset(null);
                        setError(null);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: idx < destSuggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
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
                        <Navigation size={15} color={item.type === 'local_preset' ? '#2563EB' : '#64748B'} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B' }}>{item.shortName}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{item.displayName}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 8,
                        backgroundColor: item.type === 'local_preset' ? '#EFF6FF' : '#F1F5F9',
                        color: item.type === 'local_preset' ? '#2563EB' : '#475569'
                      }}>
                        {item.type === 'local_preset' ? 'Corridor' : 'Location'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
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

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
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

      {/* Stale Result Notice Banner */}
      {isResultStale && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FCD34D',
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={18} />
            <span>Route parameters have changed. Previous corridor results are now outdated.</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleFormSubmit}
          >
            Recalculate Corridor Rest Stops
          </button>
        </div>
      )}

      {/* Route Results View (Hidden if stale until recalculated) */}
      {planResult && !isResultStale && (
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
                <h3 style={{ fontSize: 18, margin: '2px 0' }}>
                  {planResult.origin} ➔ {planResult.destination}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: 24, textAlign: 'right' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Estimated Corridor Distance
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {planResult.total_route_distance_km.toFixed(1)} km
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Estimated Travel Time
                  </div>
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
              <span>
                Corridor distance is calculated geometrically between GPS coordinates at an average 25 km/h urban speed. Actual navigation route distances may vary with one-way streets, traffic, and signals.
              </span>
            </div>
          </div>

          {/* Matched Facilities on Corridor */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>
              Corridor Rest Point Matches ({planResult.facilities.length})
            </h3>

            {planResult.facilities.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  No rest points met your amenity requirements within a {maxDetourKm} km corridor detour.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  Try increasing your detour tolerance to 2.5 km or unchecking some amenity filters.
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
                        <h4 style={{ fontSize: 16, margin: 0 }}>{match.facility.name}</h4>
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detour from corridor</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary-dark)' }}>
                          +{formatDetourDistance(match.estimated_corridor_detour_km)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {match.straight_line_dist_km.toFixed(1)} km from pickup
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
