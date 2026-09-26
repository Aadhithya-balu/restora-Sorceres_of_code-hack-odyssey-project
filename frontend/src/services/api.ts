import { 
  User, Facility, FacilityReport, FacilityReview, BreakSession, 
  SupportResource, PartnerOffer, RecommendationResult, 
  RoutePlanResponse, IncomeImpactEstimate, AdminOverview,
  UserRegisterData, RestPointAIResponse, RakshitArthaAIResponse
} from '../types';

const API_BASE = (typeof window !== 'undefined' && window.location.port === '5173') 
  ? 'http://localhost:8000' 
  : '';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('restora_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...options.headers };
  
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const authApi = {
  register: (data: UserRegisterData) => request<{ access_token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (data: { email: string; password: string }) => request<{ access_token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMe: () => request<User>('/api/auth/me'),
  updateProfile: (data: Partial<User>) => request<User>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};

export const facilityApi = {
  getFacilities: (params?: { 
    category?: string; 
    service?: string; 
    access_type?: string; 
    q?: string; 
    lat?: number; 
    lng?: number; 
    max_distance_meters?: number;
    is_24_7?: boolean;
    open_now?: boolean;
    status?: string;
  }) => {
    const qp = new URLSearchParams();
    if (params?.category) qp.append('category', params.category);
    if (params?.service) qp.append('service', params.service);
    if (params?.access_type) qp.append('access_type', params.access_type);
    if (params?.q) qp.append('q', params.q);
    if (params?.lat) qp.append('lat', params.lat.toString());
    if (params?.lng) qp.append('lng', params.lng.toString());
    if (params?.max_distance_meters) qp.append('max_distance_meters', params.max_distance_meters.toString());
    if (params?.is_24_7 !== undefined) qp.append('is_24_7', params.is_24_7.toString());
    if (params?.open_now !== undefined) qp.append('open_now', params.open_now.toString());
    if (params?.status) qp.append('status', params.status);
    const qs = qp.toString() ? `?${qp.toString()}` : '';
    return request<Facility[]>(`/api/facilities${qs}`);
  },
  getNearbyFacilities: (params: { lat: number; lng: number; category?: string; service?: string; initialRadius?: number; step?: number; minResults?: number; maxRadius?: number }) => {
    const qp = new URLSearchParams();
    qp.append('lat', params.lat.toString());
    qp.append('lng', params.lng.toString());
    if (params.category) qp.append('category', params.category);
    if (params.service) qp.append('service', params.service);
    if (params.initialRadius) qp.append('initialRadius', params.initialRadius.toString());
    if (params.step) qp.append('step', params.step.toString());
    if (params.minResults) qp.append('minResults', params.minResults.toString());
    if (params.maxRadius) qp.append('maxRadius', params.maxRadius.toString());
    
    return request<{ facilities: Facility[]; searchRadiusKm: number; expanded: boolean; message: string }>(`/api/facilities/nearby?${qp.toString()}`);
  },
  getFacility: (id: number, lat = 11.0267, lng = 77.0118) => 
    request<Facility>(`/api/facilities/${id}?lat=${lat}&lng=${lng}`),
  getPendingFacilities: () => request<Facility[]>('/api/facilities/pending'),
  createFacility: (data: Partial<Facility>) => request<Facility>('/api/facilities', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateFacility: (id: number, data: Partial<Facility>) => request<Facility>(`/api/facilities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  approveFacility: (id: number) => request<Facility>(`/api/facilities/${id}/approve`, {
    method: 'PATCH'
  }),
  rejectFacility: (id: number) => request<Facility>(`/api/facilities/${id}/reject`, {
    method: 'PATCH'
  }),
  deleteFacility: (id: number) => request<{ success: boolean }>(`/api/facilities/${id}`, {
    method: 'DELETE'
  }),
  verifyFacility: (data: { facility_id: number; washroom_ok: boolean; water_ok: boolean; charging_ok: boolean; rest_ok: boolean; notes?: string }) => 
    request<{ success: boolean; message: string }>('/api/facilities/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createReview: (facilityId: number, data: { rating: number; cleanliness?: number; accessibility?: number; safety?: number; comment?: string }) => 
    request<FacilityReview>(`/api/facilities/${facilityId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ facility_id: facilityId, ...data })
    }),
  getReviews: (facilityId: number) => request<FacilityReview[]>(`/api/facilities/${facilityId}/reviews`),
  seedDemoFacilities: (lat: number, lng: number, city = 'Current Location') => 
    request<{ success: boolean; message: string; count: number }>('/api/facilities/seed-demo', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, city })
    })
};

export const recommendationApi = {
  getIntelligentRecommendations: (params: {
    lat: number;
    lng: number;
    need_water?: boolean;
    need_washroom?: boolean;
    need_charging?: boolean;
    need_rest?: boolean;
    need_shade?: boolean;
    need_food?: boolean;
    need_medical?: boolean;
    max_distance_meters?: number;
  }) => request<{ total_found: number; recommendations: RecommendationResult[] }>('/api/recommendations/intelligent', {
    method: 'POST',
    body: JSON.stringify(params)
  })
};

export const routeApi = {
  planRoute: (data: {
    origin_name: string;
    origin_lat: number;
    origin_lng: number;
    destination_name: string;
    destination_lat: number;
    destination_lng: number;
    required_services?: string[];
    max_detour_km?: number;
  }) => request<RoutePlanResponse>('/api/routes/plan', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const reportApi = {
  createReport: (data: { facility_id: number; report_type: string; description: string; image_url?: string }) => 
    request<FacilityReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getReports: (params?: { facility_id?: number; user_id?: number; status?: string }) => {
    const qp = new URLSearchParams();
    if (params?.facility_id) qp.append('facility_id', params.facility_id.toString());
    if (params?.user_id) qp.append('user_id', params.user_id.toString());
    if (params?.status) qp.append('status', params.status);
    const qs = qp.toString() ? `?${qp.toString()}` : '';
    return request<FacilityReport[]>(`/api/reports${qs}`);
  },
  getReport: (id: number) => request<FacilityReport>(`/api/reports/${id}`),
  moderateReport: (id: number, data: { status: string; review_notes?: string }) => 
    request<FacilityReport>(`/api/reports/${id}/moderate`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteReport: (id: number) => request<{ success: boolean }>(`/api/reports/${id}`, {
    method: 'DELETE'
  })
};

export const breakApi = {
  createBreak: (data: { facility_id?: number; planned_duration_minutes: number; notes?: string }) => 
    request<BreakSession>('/api/breaks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getBreaks: () => request<BreakSession[]>('/api/breaks'),
  updateBreak: (id: number, data: { status?: string; actual_duration_minutes?: number; notes?: string }) => 
    request<any>(`/api/breaks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  estimateImpact: (data: { hourly_rate_estimate: number; planned_break_minutes: number }) => 
    request<IncomeImpactEstimate>('/api/breaks/estimate-impact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  toggleBookmark: (facilityId: number) => request<{ bookmarked: boolean; message: string }>(`/api/bookmarks/${facilityId}`, {
    method: 'POST'
  }),
  getBookmarks: (lat = 11.0267, lng = 77.0118) => request<{ id: number; facility: Facility; created_at: string }[]>(`/api/bookmarks?lat=${lat}&lng=${lng}`)
};

export const supportApi = {
  getSupportResources: (category?: string) => {
    const qs = category && category !== 'ALL' ? `?category=${category}` : '';
    return request<SupportResource[]>(`/api/support-resources${qs}`);
  },
  createSupportResource: (data: Partial<SupportResource>) => request<SupportResource>('/api/support-resources', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteSupportResource: (id: number) => request<{ success: boolean }>(`/api/support-resources/${id}`, {
    method: 'DELETE'
  }),
  getPartnerOffers: () => request<PartnerOffer[]>('/api/partner-offers'),
  createPartnerOffer: (data: Partial<PartnerOffer>) => request<PartnerOffer>('/api/partner-offers', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const adminApi = {
  getOverview: () => request<AdminOverview>('/api/admin/overview')
};

export const aiApi = {
  recommendRestpoints: (data: {
    query: string;
    lat: number;
    lng: number;
    max_distance_km?: number;
  }) => request<RestPointAIResponse>('/api/ai/restpoint-recommend', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  evaluateDisruption: (data: {
    lat: number;
    lng: number;
    daily_income: number;
    working_hours: number;
    downtime_hours: number;
    affected_days: number;
    client_weather?: any;
  }) => request<RakshitArthaAIResponse>('/api/ai/rakshitartha-disruption', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
