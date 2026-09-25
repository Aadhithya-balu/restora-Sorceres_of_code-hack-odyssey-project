import React, { useState, useEffect } from 'react';
import { 
  Shield, CloudRain, Sun, Wind, AlertTriangle, 
  HelpCircle, CheckCircle, ArrowRight, RefreshCw, 
  Calculator, Info, Compass, Coffee, MapPin, 
  Sliders, Activity, Sparkles, User as UserIcon, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { authApi, aiApi } from '../services/api';
import { ProtectionTier, DisruptionScenario, ParametricSimulationStage, RakshitArthaAIResponse } from '../types';

interface RakshitArthaPageProps {
  onNavigate: (tab: string) => void;
}

export const RakshitArthaPage: React.FC<RakshitArthaPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, openAuthModal, refreshUser } = useAuth();

  // --- Weather & Disruption Telemetry State ---
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // --- Income Impact Estimator State ---
  const [dailyIncome, setDailyIncome] = useState<number>(800);
  const [workingHours, setWorkingHours] = useState<number>(8);
  const [downtimeHours, setDowntimeHours] = useState<number>(3);
  const [affectedDays, setAffectedDays] = useState<number>(1);
  const [dailyOperatingCost, setDailyOperatingCost] = useState<number>(150);
  const [calculatorErrors, setCalculatorErrors] = useState<string[]>([]);
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateSavedMessage, setRateSavedMessage] = useState<string | null>(null);

  // --- Protection Tiers Explorer State ---
  const [selectedTier, setSelectedTier] = useState<string>('standard');

  // --- 5-Stage Parametric Claim Simulation State ---
  const [simActive, setSimActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [simTriggerType, setSimTriggerType] = useState<'HEAVY_RAIN' | 'EXTREME_HEAT' | 'HIGH_WIND'>('HEAVY_RAIN');

  // --- Groq AI Disruption Assistant State ---
  const [aiEvaluation, setAiEvaluation] = useState<RakshitArthaAIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const runAiDisruptionAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await aiApi.evaluateDisruption({
        lat: 11.0267,
        lng: 77.0118,
        daily_income: dailyIncome,
        working_hours: workingHours,
        downtime_hours: downtimeHours,
        affected_days: affectedDays,
        client_weather: weather ? {
          temperature: weather.temperature,
          wind_speed: weather.windSpeed,
          precipitation: weather.isRaining ? 12 : 0,
          precipitation_prob: weather.precipitationProb,
          condition_text: weather.conditionText,
          last_updated: lastRefreshed
        } : undefined
      });
      setAiEvaluation(res);
    } catch (err: any) {
      setAiError(err.message || 'AI disruption analysis temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  // Load weather data on mount
  const loadWeatherData = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // Default to Coimbatore / Peelamedu coordinates
      const data = await fetchWeather(11.0267, 77.0118);
      setWeather(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setWeatherError('Unable to connect to live meteorological service. Showing simulated corridor telemetry.');
      // Fallback telemetry
      setWeather({
        temperature: 32,
        windSpeed: 18,
        weatherCode: 2,
        isRaining: false,
        precipitationProb: 25,
        conditionText: 'Partly Cloudy',
        safetyGuidance: 'Moderate conditions. Keep hydrated during peak afternoon delivery shifts.',
        isExtreme: false
      });
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
    runAiDisruptionAnalysis();
  }, []);

  // Sync hourly rate estimate from authenticated user profile if available
  useEffect(() => {
    if (user?.hourly_rate_estimate && user.hourly_rate_estimate > 0) {
      const estimatedDaily = Math.round(user.hourly_rate_estimate * 8);
      setDailyIncome(estimatedDaily);
      setWorkingHours(8);
    }
  }, [user]);

  // Validate calculator inputs
  const validateCalculator = () => {
    const errors: string[] = [];
    if (dailyIncome <= 0) errors.push('Daily income must be greater than ₹0.');
    if (workingHours <= 0 || workingHours > 24) errors.push('Working hours per day must be between 1 and 24 hours.');
    if (downtimeHours < 0) errors.push('Downtime hours cannot be negative.');
    if (downtimeHours > workingHours) errors.push('Downtime cannot exceed daily working hours.');
    if (affectedDays < 1 || affectedDays > 30) errors.push('Affected days must be between 1 and 30 days.');
    if (dailyOperatingCost < 0) errors.push('Daily operating cost cannot be negative.');
    return errors;
  };

  // Calculations
  const calculatedHourlyRate = workingHours > 0 ? dailyIncome / workingHours : 0;
  const grossIncomeLoss = calculatedHourlyRate * downtimeHours * affectedDays;
  const fixedOperatingLoss = workingHours > 0 
    ? (dailyOperatingCost / workingHours) * downtimeHours * affectedDays 
    : 0;
  const totalEstimatedDisruption = grossIncomeLoss + fixedOperatingLoss;

  const handleSaveHourlyRateToProfile = async () => {
    if (!isAuthenticated || !user) {
      openAuthModal('login');
      return;
    }
    const rateToSave = Math.round(calculatedHourlyRate);
    setIsSavingRate(true);
    setRateSavedMessage(null);
    try {
      await authApi.updateProfile({ hourly_rate_estimate: rateToSave });
      await refreshUser();
      setRateSavedMessage(`Hourly rate of ₹${rateToSave}/hr successfully saved to your Restora profile!`);
      setTimeout(() => setRateSavedMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile rate.');
    } finally {
      setIsSavingRate(false);
    }
  };

  // Micro-protection tiers data
  const tiers: ProtectionTier[] = [
    {
      id: 'essential',
      name: 'Essential Shield',
      tagline: 'Basic weather threshold safety net for part-time riders',
      weeklyMicroContribution: 19,
      coverageCap: 600,
      disruptionTriggers: ['Rainfall rate > 50 mm/hr', 'Ambient temperature > 42°C (Heatwave)'],
      features: [
        'Automated rain radar monitoring',
        'Direct rest-stop corridor guidance',
        'Educational parametric trigger log'
      ],
      recommendedCategory: ['delivery_rider', 'courier_worker']
    },
    {
      id: 'standard',
      name: 'Standard Resilience',
      tagline: 'Comprehensive monsoon & heat protection for full-time gig workers',
      weeklyMicroContribution: 39,
      coverageCap: 1500,
      disruptionTriggers: [
        'Rainfall rate > 35 mm/hr for 2+ consecutive hours',
        'Ambient temperature > 40°C or Heat Index > 46°C',
        'Severe Air Quality Index (AQI > 250)'
      ],
      features: [
        'Corridor-level rainfall verification',
        'Automatic downtime calculation',
        'Priority verified rest-point recommendations',
        'Voluntary break compensation estimation'
      ],
      recommendedCategory: ['delivery_rider', 'cab_driver', 'logistics_worker'],
      isPopular: true
    },
    {
      id: 'plus',
      name: 'Plus All-Weather',
      tagline: 'Maximum multi-hazard coverage for long-distance cab and logistics drivers',
      weeklyMicroContribution: 69,
      coverageCap: 2800,
      disruptionTriggers: [
        'Rainfall rate > 25 mm/hr or waterlogging warning',
        'Ambient temperature > 38°C',
        'Crosswinds > 40 km/h on highway corridors',
        'Civic corridor waterlogging alerts'
      ],
      features: [
        'All standard features',
        'Corridor road closure alerts',
        'Fixed vehicle overhead protection allowance',
        'Zero-paperwork simulated oracle verification'
      ],
      recommendedCategory: ['cab_driver', 'logistics_worker']
    }
  ];

  // Disruption scenarios
  const scenarios: DisruptionScenario[] = [
    {
      id: 'heavy_monsoon',
      title: 'Intense Monsoon Cloudburst',
      category: 'RAIN',
      triggerThreshold: 'Rainfall > 35 mm/hr for 90+ minutes',
      severityLevel: 'SEVERE',
      estimatedDowntimeHours: 3.5,
      impactExplanation: 'Two-wheeler stability drops sharply; road waterlogging along Avinashi Road and underpasses creates hazardous delivery conditions.',
      recommendedAction: 'Halt outdoor transit. Seek shelter at the nearest verified covered rest point. Drink water and charge devices.'
    },
    {
      id: 'heatwave_peak',
      title: 'Peak Summer Heatwave',
      category: 'HEAT',
      triggerThreshold: 'Ambient Temp > 39°C or Heat Index > 45°C',
      severityLevel: 'SEVERE',
      estimatedDowntimeHours: 2.5,
      impactExplanation: 'High risk of heatstroke, severe dehydration, and smartphone thermal throttling on handlebar mounts.',
      recommendedAction: 'Schedule a mandatory 20-minute rest stop every 90 minutes. Rest at facilities with free cold drinking water and shade.'
    },
    {
      id: 'strong_crosswinds',
      title: 'Squall / High Crosswinds',
      category: 'WIND',
      triggerThreshold: 'Wind gusts exceeding 38 km/h',
      severityLevel: 'MODERATE',
      estimatedDowntimeHours: 1.5,
      impactExplanation: 'Dangerous crosswinds on flyovers and peripheral highways increase tip-over risk for delivery bikes with large rear boxes.',
      recommendedAction: 'Reduce corridor travel speed. Avoid high-level flyovers and take arterial sheltered roads.'
    },
    {
      id: 'waterlogging_corridor',
      title: 'Transit Corridor Waterlogging',
      category: 'FLOOD',
      triggerThreshold: 'Water level > 1.5 feet at major subway corridors',
      severityLevel: 'SEVERE',
      estimatedDowntimeHours: 4.0,
      impactExplanation: 'Two-wheeler engine stalls and hydraulic lock risk; major delivery platforms experience localized service pauses.',
      recommendedAction: 'Do not attempt to cross flooded underpasses. Check Restora rest-aware route planner for high-ground detours.'
    }
  ];

  // 5-Stage Simulation Runner
  const simulationStages: ParametricSimulationStage[] = [
    {
      step: 1,
      title: 'Environmental Trigger Detected',
      detail: simTriggerType === 'HEAVY_RAIN' 
        ? 'IMD & Open-Meteo radar detected 48 mm/hr rainfall over Peelamedu corridor (Threshold: 35 mm/hr).'
        : simTriggerType === 'EXTREME_HEAT'
        ? 'Heat sensor telemetry recorded 41.2°C ambient temperature (Threshold: 40°C).'
        : 'Anemometer recorded sustained gusts of 44 km/h (Threshold: 38 km/h).',
      status: currentStep >= 1 ? 'COMPLETED' : 'PENDING'
    },
    {
      step: 2,
      title: 'Corridor & Geolocation Ping Validation',
      detail: 'Worker location confirmed in Peelamedu–Hope College transit zone during disruption window.',
      status: currentStep >= 2 ? 'COMPLETED' : 'PENDING'
    },
    {
      step: 3,
      title: 'Automated Loss & Downtime Assessment',
      detail: `Calculated 2.5 hours of unavoidable downtime. Estimated opportunity loss: ₹${Math.round(calculatedHourlyRate * 2.5)}. Zero manual paperwork required.`,
      status: currentStep >= 3 ? 'COMPLETED' : 'PENDING'
    },
    {
      step: 4,
      title: 'Oracle Consensus & Fraud Audit',
      detail: 'Multi-source validation confirmed weather intensity via 3 independent weather data nodes. No false triggers.',
      status: currentStep >= 4 ? 'COMPLETED' : 'PENDING'
    },
    {
      step: 5,
      title: 'Simulated Parametric Settlement',
      detail: `[SIMULATION ONLY] Approved parametric micro-payout of ₹${Math.min(1500, Math.round(calculatedHourlyRate * 2.5))} credited to digital pool. Note: Prototype simulation — no real currency transferred.`,
      status: currentStep >= 5 ? 'COMPLETED' : 'PENDING'
    }
  ];

  const handleStartSimulation = () => {
    setSimActive(true);
    setCurrentStep(1);

    const stepIntervals = [1200, 2400, 3600, 4800];
    stepIntervals.forEach((delay, idx) => {
      setTimeout(() => {
        setCurrentStep(idx + 2);
      }, delay);
    });
  };

  const handleResetSimulation = () => {
    setSimActive(false);
    setCurrentStep(0);
  };

  return (
    <div className="container page-container" style={{ display: 'flex', flexDirection: 'column', gap: 36, paddingBottom: 60 }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #042F2E 0%, #0F172A 100%)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 28px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 840 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(20, 184, 166, 0.2)',
            border: '1px solid rgba(20, 184, 166, 0.4)',
            color: '#5EEAD4',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 16
          }}>
            <Shield size={14} />
            <span>RakshitArtha Disruption Support Module</span>
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: '#FFFFFF' }}>
            Gig-Worker Income Protection & Disruption Support
          </h1>

          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#CBD5E1', marginBottom: 20 }}>
            Extreme monsoon rain, severe heatwaves, and waterlogged roads directly rob gig workers of daily earnings. 
            RakshitArtha provides transparent environmental disruption monitoring, downtime income impact estimation, 
            and safety-first break recommendations across Coimbatore transit corridors.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => onNavigate('explore')}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}
            >
              <MapPin size={16} />
              <span>Find Covered Rest Points on Map</span>
            </button>

            <button 
              onClick={() => onNavigate('breaks')}
              className="btn btn-outline"
              style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.4)' }}
            >
              <Coffee size={16} />
              <span>Log Voluntary Rest Break</span>
            </button>

            {!isAuthenticated && (
              <button 
                onClick={() => openAuthModal('register')}
                className="btn btn-secondary"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <UserIcon size={16} />
                <span>Register as Worker</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION A: Official Transparent Disclaimer */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }}>
        <Info size={22} color="#2563EB" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
            Transparent Decision-Support Prototype Notice
          </h4>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#1E3A8A', margin: 0 }}>
            RakshitArtha helps gig workers understand how weather and external disruptions may affect working time and estimated earnings. 
            It provides transparent estimates and practical support guidance. 
            <strong> It does not currently provide insurance, guaranteed compensation, or automatic bank payouts.</strong> All figures are calculated based on transparent formulas and worker-provided estimates.
          </p>
        </div>
      </div>

      {/* SECTION B: Current Environmental Disruption Status */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CloudRain size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                Live Corridor Environmental Monitor
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Monitoring atmospheric hazards across Peelamedu, Hope College & Avinashi Road, Coimbatore
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastRefreshed && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Updated: {lastRefreshed}
              </span>
            )}
            <button
              onClick={loadWeatherData}
              className="btn btn-secondary btn-sm"
              disabled={weatherLoading}
            >
              <RefreshCw size={14} className={weatherLoading ? 'spin' : ''} />
              <span>{weatherLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {weatherError && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#B45309',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            marginBottom: 16
          }}>
            {weatherError}
          </div>
        )}

        {/* Telemetry Grid */}
        <div className="grid grid-4" style={{ gap: 14 }}>
          {/* Temperature & Heat */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Temperature
              </span>
              <Sun size={18} color="#F59E0B" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              {weather ? `${Math.round(weather.temperature)}°C` : '--'}
            </div>
            <div style={{ fontSize: 12, color: weather && weather.temperature > 36 ? 'var(--danger)' : 'var(--text-secondary)', marginTop: 4 }}>
              {weather && weather.temperature > 36 ? '⚠️ Extreme Heat Warning' : 'Normal thermal range'}
            </div>
          </div>

          {/* Rainfall & Precipitation */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Precipitation
              </span>
              <CloudRain size={18} color="#3B82F6" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              {weather ? `${weather.precipitationProb}%` : '--'}
            </div>
            <div style={{ fontSize: 12, color: weather && weather.isRaining ? 'var(--primary)' : 'var(--text-secondary)', marginTop: 4 }}>
              {weather && weather.isRaining ? '🌧️ Active rain on transit routes' : 'Dry road conditions'}
            </div>
          </div>

          {/* Wind Speed */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Wind Velocity
              </span>
              <Wind size={18} color="#6366F1" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              {weather ? `${Math.round(weather.windSpeed)} km/h` : '--'}
            </div>
            <div style={{ fontSize: 12, color: weather && weather.windSpeed > 30 ? 'var(--warning)' : 'var(--text-secondary)', marginTop: 4 }}>
              {weather && weather.windSpeed > 30 ? '⚠️ High crosswind hazard' : 'Safe for two-wheelers'}
            </div>
          </div>

          {/* Overall Disruption Status */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Corridor Safety
              </span>
              <Activity size={18} color={weather?.isExtreme ? 'var(--danger)' : 'var(--success)'} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: weather?.isExtreme ? 'var(--danger)' : 'var(--success)' }}>
              {weather?.isExtreme ? 'Hazardous' : 'Operational'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {weather?.conditionText || 'Analyzing telemetry...'}
            </div>
          </div>
        </div>

        {/* Safety Guidance Box */}
        {weather && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            backgroundColor: weather.isExtreme ? '#FEF2F2' : 'var(--surface-subtle)',
            border: `1px solid ${weather.isExtreme ? '#FECACA' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <Shield size={18} color={weather.isExtreme ? 'var(--danger)' : 'var(--primary)'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
              <strong>Real-Time Rider Advisory:</strong> {weather.safetyGuidance}
            </div>
            <button 
              onClick={() => onNavigate('explore')}
              className="btn btn-outline btn-sm"
              style={{ flexShrink: 0 }}
            >
              Locate Nearby Rest Point →
            </button>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          Data Source: Open-Meteo High-Resolution Numerical Weather Model • Coimbatore Peelamedu Station
        </div>
      </div>

      {/* SECTION B.2: AI Disruption Assistant (Groq LLM + Real Telemetry + Real Support Facilities) */}
      <div className="card" style={{
        padding: 24,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)',
        border: '1.5px solid #DDD6FE'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#4C1D95' }}>
                  AI Disruption Assistant
                </h2>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                  ⚡ Groq LLM + Factual Telemetry
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6D28D9', margin: '2px 0 0 0' }}>
                Real meteorological telemetry + deterministic disruption rules + nearby Restora support facilities
              </p>
            </div>
          </div>

          <button
            onClick={runAiDisruptionAnalysis}
            disabled={aiLoading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#DDD6FE', color: '#6D28D9' }}
          >
            <RefreshCw size={13} className={aiLoading ? 'spin' : ''} />
            <span>{aiLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>

        {/* Real vs Demo Separation Badges Banner */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
          padding: '8px 12px',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #E9D5FF',
          fontSize: 12
        }}>
          <span style={{ fontWeight: 600, color: '#4C1D95' }}>Data Provenance:</span>
          <span style={{ color: '#047857', fontWeight: 600 }}>✓ Real Weather API</span>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ color: '#047857', fontWeight: 600 }}>✓ Deterministic Calculations</span>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ color: '#047857', fontWeight: 600 }}>✓ Real Restora Facilities</span>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ color: '#B45309', fontWeight: 600 }}>⚠️ Demo Coverage & Payout Values</span>
        </div>

        {/* Content */}
        {aiError && (
          <div style={{ padding: 12, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', color: '#B91C1C', fontSize: 13, marginBottom: 12 }}>
            {aiError}
          </div>
        )}

        {aiEvaluation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* AI Grounded Explanation */}
            <div style={{
              padding: '16px 18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DDD6FE',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: '#1E293B',
              lineHeight: 1.6
            }}>
              <div style={{ fontWeight: 700, color: '#6D28D9', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} color="#7C3AED" /> AI Environmental Assessment & Rider Advisory:
              </div>
              <p style={{ margin: 0, fontStyle: 'italic' }}>
                "{aiEvaluation.explanation}"
              </p>
            </div>

            {/* Structured Telemetry & Rule Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Weather Condition [REAL]
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {aiEvaluation.weather.condition_text} ({aiEvaluation.weather.temperature}°C)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Rain: {aiEvaluation.weather.precipitation_prob}% • Wind: {aiEvaluation.weather.wind_speed} km/h
                </div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Disruption Rule [DETERMINISTIC]
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: aiEvaluation.disruption_rule.threshold_met ? '#B45309' : '#059669', marginTop: 2 }}>
                  {aiEvaluation.disruption_rule.condition_type.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {aiEvaluation.disruption_rule.status_label}
                </div>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Estimated Downtime Impact [CALCULATED]
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C', marginTop: 2 }}>
                  ₹{aiEvaluation.income_calculation.total_estimated_impact}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Illustrative estimate based on user input
                </div>
              </div>
            </div>

            {/* Nearby Worker Support Facilities from Real Restora DB */}
            {aiEvaluation.nearby_support_facilities.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4C1D95' }}>
                    🛡️ Nearby Worker Support Facilities [REAL RESTORA DATA]
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Covered shade, drinking water, and safe rest during adverse weather
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                  {aiEvaluation.nearby_support_facilities.map((fac) => (
                    <div
                      key={fac.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #DDD6FE',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>
                          {fac.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          📍 {fac.zone || fac.city} • <strong style={{ color: 'var(--primary)' }}>{fac.distance_meters ? `${fac.distance_meters}m away` : 'Nearby'}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                          {fac.has_shade && <span>🌳 Shade</span>}
                          {fac.has_water && <span>💧 Water</span>}
                          {fac.has_charging && <span>🔋 Charging</span>}
                          {fac.has_rest && <span>🛋️ Rest</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('explore')}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                      >
                        Locate →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION C: Estimated Income Impact Calculator */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Calculator size={22} color="var(--primary)" />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            Disruption Downtime & Income Impact Estimator
          </h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Calculate your estimated earnings disruption during severe rainstorms, excessive heat, or localized road inundation.
        </p>

        <div className="grid grid-2" style={{ gap: 24 }}>
          {/* Inputs Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Average Daily Income (₹) *</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{dailyIncome}</span>
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                step="50"
                className="form-input"
                value={dailyIncome}
                onChange={(e) => setDailyIncome(Math.max(0, Number(e.target.value)))}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Typical earnings from completed orders/trips on a standard day.</span>
            </div>

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Daily Working Hours *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="form-input"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Downtime Hours per Day *</label>
                <input
                  type="number"
                  min="0"
                  max={workingHours}
                  className="form-input"
                  value={downtimeHours}
                  onChange={(e) => setDowntimeHours(Math.min(workingHours, Math.max(0, Number(e.target.value))))}
                />
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Affected Disruption Days *</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  className="form-input"
                  value={affectedDays}
                  onChange={(e) => setAffectedDays(Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Daily Fuel/Fixed Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="25"
                  className="form-input"
                  value={dailyOperatingCost}
                  onChange={(e) => setDailyOperatingCost(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            {/* Save to Profile Action */}
            <div style={{
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              marginTop: 6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Derived Hourly Rate: <strong>₹{Math.round(calculatedHourlyRate)}/hour</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isAuthenticated 
                      ? 'Save this to your Restora profile for future break & income calculations.'
                      : 'Sign in to save this rate to your permanent worker profile.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveHourlyRateToProfile}
                  className="btn btn-secondary btn-sm"
                  disabled={isSavingRate || calculatedHourlyRate <= 0}
                >
                  <UserIcon size={14} />
                  <span>{isSavingRate ? 'Saving...' : 'Save to Profile'}</span>
                </button>
              </div>

              {rateSavedMessage && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {rateSavedMessage}
                </div>
              )}
            </div>
          </div>

          {/* Results Column */}
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                Estimated Downtime Disruption Impact
              </div>

              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Total Estimated Income Impact
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#B91C1C', letterSpacing: '-0.02em' }}>
                  ₹{Math.round(totalEstimatedDisruption).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  (₹{Math.round(grossIncomeLoss)} lost opportunity + ₹{Math.round(fixedOperatingLoss)} idle vehicle fixed costs)
                </div>
              </div>

              {/* Formula Breakdown */}
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Transparent Calculation Formula:
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  backgroundColor: 'var(--surface)',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontSize: 11
                }}>
                  Hourly Rate = Daily Income (₹{dailyIncome}) ÷ Working Hours ({workingHours}h) = ₹{Math.round(calculatedHourlyRate)}/h<br/>
                  Gross Disruption = ₹{Math.round(calculatedHourlyRate)}/h × {downtimeHours}h downtime × {affectedDays} day(s) = ₹{Math.round(grossIncomeLoss)}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 18,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              <strong>Disclaimer:</strong> This calculation is an illustrative estimate based strictly on worker-entered figures. It is not verified tax data and does not represent an actual insurance claim, entitlement, or payout guarantee.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D: Disruption Scenario Models */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={20} color="var(--primary)" />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              Atmospheric Disruption Scenario Models
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Transparent rule-based models for Coimbatore delivery and transit corridors.
          </p>
        </div>

        <div className="grid grid-2" style={{ gap: 16 }}>
          {scenarios.map((scenario) => (
            <div 
              key={scenario.id}
              style={{
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{scenario.title}</h3>
                  <span className={`badge ${scenario.severityLevel === 'SEVERE' ? 'badge-danger' : 'badge-warning'}`}>
                    {scenario.severityLevel}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--primary-dark)', fontWeight: 600, marginBottom: 8 }}>
                  Trigger Condition: {scenario.triggerThreshold}
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  {scenario.impactExplanation}
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--text-primary)'
              }}>
                <strong>Recommended Worker Action:</strong> {scenario.recommendedAction}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION E: Parametric Protection Tiers & 5-Stage Claim Flow Simulation */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--primary)" />
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                Parametric Micro-Protection Tiers (Educational Model)
              </h2>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Conceptual weekly micro-shield architectures inspired by RakshitArtha research.
            </p>
          </div>

          <span className="badge badge-warning" style={{ fontSize: 11, fontWeight: 700 }}>
            DEMO / ILLUSTRATIVE MODEL
          </span>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
          {tiers.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                style={{
                  backgroundColor: isSelected ? '#F0FDFA' : 'var(--surface-subtle)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                {tier.isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    right: 14,
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase'
                  }}>
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{tier.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    {tier.tagline}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
                      ₹{tier.weeklyMicroContribution}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ week</span>
                    <span className="badge badge-warning" style={{ fontSize: 9, padding: '1px 5px' }}>
                      DEMO
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    fontSize: 12,
                    marginBottom: 12
                  }}>
                    <span style={{ fontSize: 10, color: '#B45309', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      DEMO / ILLUSTRATIVE
                    </span>
                    Simulated Disruption Cap: <strong>Up to ₹{tier.coverageCap}</strong>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Automated Parametric Triggers:</div>
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {tier.disruptionTriggers.map((trig, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{trig}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {isSelected ? '✓ Selected for Simulator' : 'Click to select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5-Stage Simulation Runner */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          padding: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color="#5EEAD4" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                  Interactive 5-Stage Parametric Settlement Simulator
                </h3>
              </div>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                Experience how smart oracle contracts verify weather disruptions and calculate downtime without manual forms.
              </p>
            </div>

            {/* Prominent Demo Simulation Banner */}
            <div style={{
              width: '100%',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: 12,
              color: '#FCD34D',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0 }} />
              <span>
                <strong>DEMO / ILLUSTRATIVE SIMULATION:</strong> Models automated oracle logic for educational purposes. No insurance underwritten or real payments made.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                className="form-select"
                value={simTriggerType}
                onChange={(e) => {
                  setSimTriggerType(e.target.value as any);
                  handleResetSimulation();
                }}
                disabled={simActive}
                style={{
                  backgroundColor: '#1E293B',
                  borderColor: '#334155',
                  color: '#FFFFFF',
                  fontSize: 12,
                  padding: '6px 10px'
                }}
              >
                <option value="HEAVY_RAIN">🌧️ Trigger: Intense Cloudburst (48 mm/hr)</option>
                <option value="EXTREME_HEAT">☀️ Trigger: Severe Heatwave (41.2°C)</option>
                <option value="HIGH_WIND">💨 Trigger: Dangerous Squall (44 km/h)</option>
              </select>

              {!simActive ? (
                <button
                  type="button"
                  onClick={handleStartSimulation}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}
                >
                  Run Simulation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: '#334155', color: '#FFFFFF', borderColor: '#475569' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* 5-Stage Progression Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {simulationStages.map((stg) => {
              const isCompleted = stg.status === 'COMPLETED';
              const isCurrent = currentStep === stg.step;
              return (
                <div
                  key={stg.step}
                  style={{
                    backgroundColor: isCompleted ? 'rgba(20, 184, 166, 0.1)' : '#1E293B',
                    border: `1px solid ${isCompleted ? 'rgba(20, 184, 166, 0.4)' : isCurrent ? '#38BDF8' : '#334155'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? 'var(--primary)' : isCurrent ? '#0284C7' : '#475569',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {isCompleted ? '✓' : stg.step}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isCompleted ? '#5EEAD4' : '#F8FAFC' }}>
                        Stage {stg.step}: {stg.title}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isCompleted ? '#34D399' : isCurrent ? '#38BDF8' : '#64748B'
                      }}>
                        {isCompleted ? 'Executed' : isCurrent ? 'Processing...' : 'Awaiting Trigger'}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {stg.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 14, fontSize: 11, color: '#64748B', textAlign: 'center' }}>
            Educational simulation demonstrating parametric oracle triggers. Zero actual bank payouts or financial guarantees.
          </div>
        </div>
      </div>

      {/* SECTION F: Support & Practical Rest Actions */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Practical Worker Safety & Rest Corridors
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          When severe weather disrupts earnings, prioritizing your physical health, hydration, and safe resting is essential.
        </p>

        <div className="grid grid-3" style={{ gap: 16 }}>
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MapPin size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Locate Shaded Rest Points</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Find community-verified facilities with clean drinking water, clean washrooms, and EV phone charging docks.
            </p>
            <button
              onClick={() => onNavigate('explore')}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Explore Rest Map →
            </button>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Coffee size={18} color="var(--accent)" />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Record Voluntary Break</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Take a planned 20-minute rest break during rain or peak heat. Restora keeps your break data private from dispatch algorithms.
            </p>
            <button
              onClick={() => onNavigate('breaks')}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Plan Rest Break →
            </button>
          </div>

          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <HelpCircle size={18} color="#6366F1" />
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Welfare & Emergency</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Access Coimbatore district gig-worker welfare board contacts, clinic emergency lines, and partner offers.
            </p>
            <button
              onClick={() => onNavigate('support')}
              className="btn btn-outline btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              View Support Helplines →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
