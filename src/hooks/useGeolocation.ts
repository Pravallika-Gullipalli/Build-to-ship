import { useState, useCallback } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCoordinates = useCallback((): Promise<Coords> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const fallback = { lat: 37.7749, lng: -122.4194 }; // Default San Francisco
        setCoordinates(fallback);
        setError('Geolocation is not supported by your browser. Using default center.');
        resolve(fallback);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoordinates(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let errMsg = 'Failed to retrieve location.';
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = 'Location permission was denied. Defaulting to center.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errMsg = 'Location position is unavailable.';
          } else if (err.code === err.TIMEOUT) {
            errMsg = 'Location request timed out.';
          }
          
          // Fallback to San Francisco center coordinates
          const fallback = { lat: 37.7749 + (Math.random() - 0.5) * 0.01, lng: -122.4194 + (Math.random() - 0.5) * 0.01 };
          setCoordinates(fallback);
          setError(errMsg);
          setLoading(false);
          resolve(fallback); // Resolve with fallback to not block app flow
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }, []);

  return {
    loading,
    coordinates,
    error,
    getCoordinates
  };
};
export default useGeolocation;
