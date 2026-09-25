import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Wind, AlertTriangle, Info } from 'lucide-react';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { useLocation } from '../hooks/useLocation';

export const WeatherGuidance: React.FC = () => {
  const { location } = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (location.lat && location.lng) {
      setLoading(true);
      fetchWeather(location.lat, location.lng)
        .then(data => {
          setWeather(data);
          setLastUpdated(new Date());
          setError(false);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [location.lat, location.lng]);

  if (loading) {
    return <div className="card" style={{ padding: '16px', color: 'var(--text-muted)' }}>Loading weather data...</div>;
  }

  if (error || !weather) {
    return null; // Silent fail if weather is unavailable
  }

  return (
    <div className="card" style={{ 
      backgroundColor: weather.isExtreme ? '#FEF2F2' : 'var(--surface)',
      borderColor: weather.isExtreme ? '#FECACA' : 'var(--border)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, color: weather.isExtreme ? '#B91C1C' : 'inherit' }}>
          {weather.isExtreme ? <AlertTriangle size={18} /> : <Info size={18} />}
          Weather & Safety Guidance
        </h3>
        {lastUpdated && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {weather.temperature > 30 ? <Sun size={20} color="#EA580C" /> : <Sun size={20} color="#F59E0B" />}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{weather.temperature}°C</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{weather.conditionText}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <CloudRain size={20} color="#3B82F6" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>{weather.precipitationProb}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Rain Prob</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <Wind size={20} color="#64748B" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>{weather.windSpeed} km/h</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wind</span>
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '10px 14px', 
        backgroundColor: weather.isExtreme ? '#FEE2E2' : 'var(--surface-subtle)', 
        borderRadius: 'var(--radius-md)', 
        fontSize: 13,
        color: weather.isExtreme ? '#991B1B' : 'var(--text-secondary)'
      }}>
        💡 <strong>Guidance:</strong> {weather.safetyGuidance}
      </div>
    </div>
  );
};
