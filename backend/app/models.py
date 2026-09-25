import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default="worker")  # "worker" or "admin"
    worker_category = Column(String(50), default="delivery_rider")  # delivery_rider, cab_driver, courier_worker, logistics_worker, other
    preferred_language = Column(String(20), default="en")
    work_area = Column(String(120), default="Peelamedu, Coimbatore")
    hourly_rate_estimate = Column(Float, default=180.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("FacilityReport", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    break_sessions = relationship("BreakSession", back_populates="user", cascade="all, delete-orphan")
    verifications = relationship("FacilityVerification", back_populates="user", cascade="all, delete-orphan")


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False)
    category = Column(String(50), default="REST_POINT")  # REST_POINT, WASHROOM, WATER, CHARGING, SHADED_AREA, FOOD, MEDICAL
    address = Column(String(255), nullable=False)
    zone = Column(String(100), default="Peelamedu")
    city = Column(String(100), default="Coimbatore")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    
    is_open = Column(Boolean, default=True)
    operating_hours = Column(String(100), default="06:00 - 23:00")
    access_type = Column(String(50), default="PUBLIC")  # PUBLIC, PRIVATE, PERMISSION_REQUIRED, RESTRICTED, UNKNOWN
    pricing_info = Column(String(100), default="Free to use")
    accessibility_info = Column(String(150), default="Ground level, 2W accessible")

    # Amenities
    has_rest = Column(Boolean, default=False)
    has_washroom = Column(Boolean, default=False)
    has_water = Column(Boolean, default=False)
    has_charging = Column(Boolean, default=False)
    has_shade = Column(Boolean, default=False)
    has_parking = Column(Boolean, default=False)
    has_food = Column(Boolean, default=False)
    has_medical = Column(Boolean, default=False)

    # Verification and trust status
    verification_status = Column(String(50), default="VERIFIED")  # VERIFIED, RECENTLY_REPORTED, UNVERIFIED, ACCESS_UNKNOWN
    verification_count = Column(Integer, default=1)
    last_reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("FacilityReport", back_populates="facility", cascade="all, delete-orphan")
    verifications = relationship("FacilityVerification", back_populates="facility", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="facility", cascade="all, delete-orphan")
    break_sessions = relationship("BreakSession", back_populates="facility")


class FacilityReport(Base):
    __tablename__ = "facility_reports"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String(120), default="Anonymous Worker")
    report_type = Column(String(60), nullable=False)  
    # OPEN, CLOSED, UNAVAILABLE, WATER_UNAVAILABLE, CHARGER_BROKEN, CLEANLINESS_CONCERN, ACCESS_RESTRICTION, HOURS_CHANGED, INCORRECT_INFO, OTHER
    description = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED, FLAGGED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_by_id = Column(Integer, nullable=True)
    review_notes = Column(String(255), nullable=True)

    facility = relationship("Facility", back_populates="reports")
    user = relationship("User", back_populates="reports")


class FacilityVerification(Base):
    __tablename__ = "facility_verifications"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    washroom_ok = Column(Boolean, default=True)
    water_ok = Column(Boolean, default=True)
    charging_ok = Column(Boolean, default=True)
    rest_ok = Column(Boolean, default=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    facility = relationship("Facility", back_populates="verifications")
    user = relationship("User", back_populates="verifications")


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="bookmarks")
    facility = relationship("Facility", back_populates="bookmarks")


class BreakSession(Base):
    __tablename__ = "break_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    planned_duration_minutes = Column(Integer, default=20)
    actual_duration_minutes = Column(Integer, nullable=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(30), default="COMPLETED")  # PLANNED, ACTIVE, COMPLETED, CANCELLED
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="break_sessions")
    facility = relationship("Facility", back_populates="break_sessions")


class SupportResource(Base):
    __tablename__ = "support_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(180), nullable=False)
    category = Column(String(60), default="WELFARE_BOARD")  # WELFARE_BOARD, EMERGENCY_CONTACT, CLINIC_PARTNER, HEALTH_GUIDELINE
    description = Column(Text, nullable=False)
    contact_number = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    link_url = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PartnerOffer(Base):
    __tablename__ = "partner_offers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(180), nullable=False)
    partner_name = Column(String(150), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)
    offer_type = Column(String(60), default="DISCOUNT_BEVERAGE")  # DISCOUNT_BEVERAGE, FREE_CHARGING, REST_PARTNERSHIP, MEAL_SUBSIDY
    description = Column(Text, nullable=False)
    terms = Column(String(255), nullable=False)
    valid_until = Column(String(50), default="Ongoing 2026")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    time_str = Column(String(20), nullable=False)
    title = Column(String(150), nullable=False)
    subtitle = Column(String(255), nullable=False)
    category = Column(String(50), default="REST")  # REST, REPORT, BREAK, COMMUNITY
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
