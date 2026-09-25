from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
import datetime

# --- Auth & User Schemas ---

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    worker_category: str = "delivery_rider"
    preferred_language: str = "en"
    work_area: str = "Peelamedu, Coimbatore"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    worker_category: str
    preferred_language: str
    work_area: str
    hourly_rate_estimate: float
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    worker_category: Optional[str] = None
    preferred_language: Optional[str] = None
    work_area: Optional[str] = None
    hourly_rate_estimate: Optional[float] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Facility Schemas ---

class FacilityBase(BaseModel):
    name: str
    category: str = "REST_POINT"
    address: str
    zone: str = "Peelamedu"
    city: str = "Coimbatore"
    lat: float
    lng: float
    is_open: bool = True
    operating_hours: str = "06:00 - 23:00"
    access_type: str = "PUBLIC"
    pricing_info: str = "Free to use"
    accessibility_info: str = "Ground level, 2W accessible"
    has_rest: bool = False
    has_washroom: bool = False
    has_water: bool = False
    has_charging: bool = False
    has_shade: bool = False
    has_parking: bool = False
    has_food: bool = False
    has_medical: bool = False
    notes: Optional[str] = None

class FacilityCreate(FacilityBase):
    pass

class FacilityUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    zone: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_open: Optional[bool] = None
    operating_hours: Optional[str] = None
    access_type: Optional[str] = None
    pricing_info: Optional[str] = None
    accessibility_info: Optional[str] = None
    has_rest: Optional[bool] = None
    has_washroom: Optional[bool] = None
    has_water: Optional[bool] = None
    has_charging: Optional[bool] = None
    has_shade: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_food: Optional[bool] = None
    has_medical: Optional[bool] = None
    verification_status: Optional[str] = None
    notes: Optional[str] = None

class FacilitySchema(FacilityBase):
    id: int
    distance_meters: Optional[int] = None
    verification_status: str
    verification_count: int
    last_reported_at: datetime.datetime
    created_at: datetime.datetime
    is_bookmarked: Optional[bool] = False

    model_config = {"from_attributes": True}

class AdaptiveSearchResponse(BaseModel):
    facilities: List[FacilitySchema]
    searchRadiusKm: float
    expanded: bool
    message: str


# --- Crowdsourced Report Schemas ---

class FacilityReportCreate(BaseModel):
    facility_id: int
    report_type: str
    description: str = Field(..., min_length=5)
    image_url: Optional[str] = None

class FacilityReportSchema(BaseModel):
    id: int
    facility_id: int
    facility_name: Optional[str] = None
    user_id: int
    user_name: str
    report_type: str
    description: str
    image_url: Optional[str] = None
    status: str
    created_at: datetime.datetime
    review_notes: Optional[str] = None

    model_config = {"from_attributes": True}

class ReportModeration(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED|FLAGGED)$")
    review_notes: Optional[str] = None


# --- Verification Schemas ---

class VerificationCreate(BaseModel):
    facility_id: int
    washroom_ok: bool = True
    water_ok: bool = True
    charging_ok: bool = True
    rest_ok: bool = True
    notes: Optional[str] = None


# --- Bookmarks ---

class BookmarkSchema(BaseModel):
    id: int
    user_id: int
    facility_id: int
    facility: FacilitySchema
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# --- Break & Income Support Schemas ---

class BreakSessionCreate(BaseModel):
    facility_id: Optional[int] = None
    planned_duration_minutes: int = 20
    notes: Optional[str] = None

class BreakSessionUpdate(BaseModel):
    status: Optional[str] = None
    actual_duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class BreakSessionSchema(BaseModel):
    id: int
    user_id: int
    facility_id: Optional[int] = None
    facility_name: Optional[str] = None
    planned_duration_minutes: int
    actual_duration_minutes: Optional[int] = None
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class IncomeImpactEstimateRequest(BaseModel):
    hourly_rate_estimate: float = Field(..., gt=0)
    planned_break_minutes: int = Field(..., gt=0)
    shift_hours: Optional[float] = 8.0

class IncomeImpactEstimateResponse(BaseModel):
    hourly_rate: float
    break_minutes: int
    estimated_opportunity_amount: float
    disclaimer: str
    health_benefit_note: str


# --- Support Resources & Partner Offers ---

class SupportResourceCreate(BaseModel):
    title: str
    category: str = "WELFARE_BOARD"
    description: str
    contact_number: Optional[str] = None
    address: Optional[str] = None
    link_url: Optional[str] = None
    is_verified: bool = True

class SupportResourceSchema(SupportResourceCreate):
    id: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}

class PartnerOfferCreate(BaseModel):
    title: str
    partner_name: str
    facility_id: Optional[int] = None
    offer_type: str = "DISCOUNT_BEVERAGE"
    description: str
    terms: str
    valid_until: str = "Ongoing 2026"
    is_active: bool = True

class PartnerOfferSchema(PartnerOfferCreate):
    id: int
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# --- Intelligent Recommendation Schemas ---

class RecommendationRequest(BaseModel):
    lat: float = 11.0267
    lng: float = 77.0118
    need_water: bool = False
    need_washroom: bool = False
    need_charging: bool = False
    need_rest: bool = False
    need_shade: bool = False
    need_food: bool = False
    need_medical: bool = False
    max_distance_meters: int = 3000

class RecommendationResult(BaseModel):
    facility: FacilitySchema
    score: float
    explanation: str

class RecommendationResponse(BaseModel):
    total_found: int
    recommendations: List[RecommendationResult]


# --- Route Planning Schemas ---

class RoutePlanRequest(BaseModel):
    origin_name: str = Field(..., min_length=1)
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lng: float = Field(..., ge=-180.0, le=180.0)
    destination_name: str = Field(..., min_length=1)
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lng: float = Field(..., ge=-180.0, le=180.0)
    required_services: List[str] = []
    max_detour_km: float = Field(default=1.5, ge=0.1, le=10.0)

class RouteFacilityMatch(BaseModel):
    facility: FacilitySchema
    straight_line_dist_km: float
    estimated_corridor_detour_km: float
    matched_services: List[str]
    stop_recommendation_reason: str

class RoutePlanResponse(BaseModel):
    origin: str
    destination: str
    total_route_distance_km: float
    estimated_travel_time_minutes: int
    nearby_facilities_count: int
    facilities: List[RouteFacilityMatch]
    disclaimer: str


# --- Admin Overview ---

class AdminOverviewResponse(BaseModel):
    total_facilities: int
    verified_facilities: int
    total_reports: int
    pending_reports: int
    total_break_sessions: int
    total_users: int
    service_gaps: List[Dict[str, Any]]


# --- Groq AI Agent Schemas ---

class RestPointAIRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    lat: float = Field(default=11.0267, ge=-90.0, le=90.0)
    lng: float = Field(default=77.0118, ge=-180.0, le=180.0)
    max_distance_km: float = Field(default=5.0, ge=0.5, le=25.0)

class RestPointAIIntent(BaseModel):
    facility_categories: List[str] = []
    purpose: str = "rest"
    max_distance_km: float = 5.0
    duration_minutes: Optional[int] = None
    availability_required: bool = True

class RestPointAIResponse(BaseModel):
    query: str
    intent: RestPointAIIntent
    explanation: str
    facilities: List[FacilitySchema]
    partial_alternatives: List[FacilitySchema] = []
    is_fallback: bool = False
    source: str = "groq"
    total_found: int = 0

class RakshitArthaAIRequest(BaseModel):
    lat: float = Field(default=11.0267, ge=-90.0, le=90.0)
    lng: float = Field(default=77.0118, ge=-180.0, le=180.0)
    daily_income: float = Field(default=800.0, gt=0)
    working_hours: float = Field(default=8.0, gt=0, le=24.0)
    downtime_hours: float = Field(default=3.0, ge=0, le=24.0)
    affected_days: float = Field(default=1.0, ge=1.0, le=30.0)
    client_weather: Optional[Dict[str, Any]] = None

class RakshitArthaAIResponse(BaseModel):
    weather: Dict[str, Any]
    disruption_rule: Dict[str, Any]
    income_calculation: Dict[str, Any]
    explanation: str
    nearby_support_facilities: List[FacilitySchema]
    is_fallback: bool = False
    source: str = "groq"
    disclaimer: str
    demo_badges: Dict[str, str]

