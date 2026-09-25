export type WorkerCategory = 
  | 'delivery_rider' 
  | 'cab_driver' 
  | 'courier_worker' 
  | 'logistics_worker' 
  | 'other';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'worker' | 'admin';
  worker_category: WorkerCategory;
  preferred_language: string;
  work_area: string;
  hourly_rate_estimate: number;
  created_at: string;
}

export interface Facility {
  id: number;
  name: string;
  category: string;
  address: string;
  zone: string;
  city: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  is_open: boolean;
  operating_hours: string;
  access_type: 'PUBLIC' | 'PRIVATE' | 'PERMISSION_REQUIRED' | 'RESTRICTED' | 'UNKNOWN';
  pricing_info: string;
  accessibility_info: string;
  has_rest: boolean;
  has_washroom: boolean;
  has_water: boolean;
  has_charging: boolean;
  has_shade: boolean;
  has_parking: boolean;
  has_food: boolean;
  has_medical: boolean;
  verification_status: 'VERIFIED' | 'RECENTLY_REPORTED' | 'UNVERIFIED' | 'ACCESS_UNKNOWN';
  verification_count: number;
  last_reported_at: string;
  notes?: string;
  created_at: string;
  is_bookmarked?: boolean;
}

export interface FacilityReport {
  id: number;
  facility_id: number;
  facility_name?: string;
  user_id: number;
  user_name: string;
  report_type: string;
  description: string;
  image_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  created_at: string;
  review_notes?: string;
}

export interface BreakSession {
  id: number;
  user_id: number;
  facility_id?: number;
  facility_name?: string;
  planned_duration_minutes: number;
  actual_duration_minutes?: number;
  start_time: string;
  end_time?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_at: string;
}

export interface SupportResource {
  id: number;
  title: string;
  category: 'WELFARE_BOARD' | 'EMERGENCY_CONTACT' | 'CLINIC_PARTNER' | 'HEALTH_GUIDELINE';
  description: string;
  contact_number?: string;
  address?: string;
  link_url?: string;
  is_verified: boolean;
  created_at: string;
}

export interface PartnerOffer {
  id: number;
  title: string;
  partner_name: string;
  facility_id?: number;
  offer_type: 'DISCOUNT_BEVERAGE' | 'FREE_CHARGING' | 'REST_PARTNERSHIP' | 'MEAL_SUBSIDY';
  description: string;
  terms: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface RecommendationResult {
  facility: Facility;
  score: number;
  explanation: string;
}

export interface RouteFacilityMatch {
  facility: Facility;
  straight_line_dist_km: number;
  estimated_corridor_detour_km: number;
  matched_services: string[];
  stop_recommendation_reason: string;
}

export interface RoutePlanResponse {
  origin: string;
  destination: string;
  total_route_distance_km: number;
  estimated_travel_time_minutes: number;
  nearby_facilities_count: number;
  facilities: RouteFacilityMatch[];
  disclaimer: string;
}

export interface IncomeImpactEstimate {
  hourly_rate: number;
  break_minutes: number;
  estimated_opportunity_amount: number;
  disclaimer: string;
  health_benefit_note: string;
}

export interface AdminOverview {
  total_facilities: number;
  verified_facilities: number;
  total_reports: number;
  pending_reports: number;
  total_break_sessions: number;
  total_users: number;
  service_gaps: {
    zone: string;
    total_points: number;
    identified_gaps: string[];
    severity: 'HIGH' | 'MODERATE' | 'BALANCED';
  }[];
}

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  worker_category: WorkerCategory;
  preferred_language: string;
  work_area: string;
  hourly_rate_estimate?: number;
}

export interface EnvironmentalDisruption {
  zone: string;
  temperature: number;
  feelsLike: number;
  rainProbability: number;
  rainfallRate: string;
  windSpeed: number;
  weatherCondition: string;
  safetyAlert?: string;
  isExtreme: boolean;
  lastUpdated: string;
}

export interface ProtectionTier {
  id: string;
  name: string;
  tagline: string;
  weeklyMicroContribution: number;
  coverageCap: number;
  disruptionTriggers: string[];
  features: string[];
  recommendedCategory: WorkerCategory[];
  isPopular?: boolean;
}

export interface DisruptionScenario {
  id: string;
  title: string;
  category: 'RAIN' | 'HEAT' | 'WIND' | 'FLOOD';
  triggerThreshold: string;
  severityLevel: 'LOW' | 'MODERATE' | 'SEVERE';
  estimatedDowntimeHours: number;
  impactExplanation: string;
  recommendedAction: string;
}

export interface ParametricSimulationStage {
  step: number;
  title: string;
  detail: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  timestamp?: string;
}

