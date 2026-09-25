import { useState, useEffect, useRef, useCallback } from 'react';

export type TrackingStatus = 
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DENIED'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED';

export interface LocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null; // in meters
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
  lastUpdated: Date | null;
  trackingStatus: TrackingStatus;
  isManualSearch: boolean;
  manualLocationName?: string;
}

// Haversine calculation to prevent API request spam on micro-jitter
function getMetersBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MOVEMENT_THRESHOLD_METERS = 35; // Minimum movement required to trigger state displacement

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionGranted: false,
    lastUpdated: null,
    trackingStatus: 'INITIALIZING',
    isManualSearch: false
  });

  const [isTrackingEnabled, setIsTrackingEnabled] = useState<boolean>(true);

  // Store last broadcast coordinates to avoid jitter re-renders
  const lastReportedCoords = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Manual searched location (takes precedence for discovery, but retains separate identity)
  const manualLocationRef = useRef<{ lat: number; lng: number; name: string } | null>(null);

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;

    // Check if user set a manual location search
    if (manualLocationRef.current) {
      // Retain manual search as primary display, but save live GPS quietly in background
      return;
    }

    // Check displacement threshold
    if (lastReportedCoords.current) {
      const distanceMoved = getMetersBetween(
        lastReportedCoords.current.lat,
        lastReportedCoords.current.lng,
        latitude,
        longitude
      );
      if (distanceMoved < MOVEMENT_THRESHOLD_METERS) {
        // Minor jitter, keep same coordinates, just update timestamp/accuracy
        setLocation(prev => ({
          ...prev,
          accuracy: Math.round(accuracy),
          lastUpdated: new Date(),
          trackingStatus: 'ACTIVE'
        }));
        return;
      }
    }

    lastReportedCoords.current = { lat: latitude, lng: longitude };

    setLocation({
      lat: latitude,
      lng: longitude,
      accuracy: Math.round(accuracy),
      error: null,
      loading: false,
      permissionGranted: true,
      lastUpdated: new Date(),
      trackingStatus: 'ACTIVE',
      isManualSearch: false
    });
  }, []);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let readableMessage = 'Your location could not be determined.';
    let status: TrackingStatus = 'UNAVAILABLE';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        readableMessage = 'Location permission was denied. You can search for a corridor or locality manually.';
        status = 'DENIED';
        break;
      case error.POSITION_UNAVAILABLE:
        readableMessage = 'Your GPS position is temporarily unavailable. Check your device location settings.';
        status = 'UNAVAILABLE';
        break;
      case error.TIMEOUT:
        readableMessage = 'Location request timed out. Showing last known coordinates.';
        status = 'TIMEOUT';
        break;
    }

    setLocation(prev => ({
      ...prev,
      error: readableMessage,
      loading: false,
      permissionGranted: error.code !== error.PERMISSION_DENIED,
      trackingStatus: status
    }));
  }, []);

  // Start watching position
  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        loading: false,
        permissionGranted: false,
        trackingStatus: 'UNSUPPORTED'
      }));
      return;
    }

    setIsTrackingEnabled(true);
    manualLocationRef.current = null;
    setLocation(prev => ({ ...prev, loading: true, isManualSearch: false, error: null }));

    // One-shot fetch for immediate snap
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000
    });

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  // Stop / pause watching position
  const stopTracking = useCallback(() => {
    setIsTrackingEnabled(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocation(prev => ({
      ...prev,
      trackingStatus: 'PAUSED'
    }));
  }, []);

  // Manual one-click refresh
  const refreshLocation = useCallback(() => {
    manualLocationRef.current = null;
    startTracking();
  }, [startTracking]);

  // Set manual searched locality (clearly distinct from GPS)
  const setManualLocation = useCallback((lat: number, lng: number, name: string) => {
    manualLocationRef.current = { lat, lng, name };
    setLocation(prev => ({
      ...prev,
      lat,
      lng,
      accuracy: null,
      error: null,
      loading: false,
      lastUpdated: new Date(),
      isManualSearch: true,
      manualLocationName: name,
      trackingStatus: 'PAUSED'
    }));
  }, []);

  // Clear manual location and revert to live GPS
  const clearManualLocation = useCallback(() => {
    manualLocationRef.current = null;
    lastReportedCoords.current = null;
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startTracking]);

  return {
    location,
    isTracking: isTrackingEnabled,
    startTracking,
    stopTracking,
    refreshLocation,
    setManualLocation,
    clearManualLocation,
    permissionGranted: location.permissionGranted
  };
}
