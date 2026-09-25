import { useState, useEffect } from 'react';

export interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
  permissionGranted: boolean;
  lastUpdated: Date | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: null, // Start with null, fallback later if needed
    lng: null,
    error: null,
    loading: true,
    permissionGranted: false,
    lastUpdated: null,
  });

  const [isTracking, setIsTracking] = useState(true); // Optional: toggle tracking

  useEffect(() => {
    let watchId: number;

    const successHandler = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        loading: false,
        permissionGranted: true,
        lastUpdated: new Date(),
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setLocation(prev => ({
        ...prev,
        error: error.message,
        loading: false,
        permissionGranted: error.code !== error.PERMISSION_DENIED,
      }));
    };

    if (isTracking && 'geolocation' in navigator) {
      setLocation(prev => ({ ...prev, loading: true }));
      // Initial fetch
      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      // Continuous tracking
      watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      });
    } else if (!('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
        permissionGranted: false,
      }));
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking]);

  return { location, isTracking, setIsTracking };
}
