from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import SupportResource, PartnerOffer
from ..schemas import SupportResourceCreate, PartnerOfferCreate

class SupportService:
    @staticmethod
    def get_support_resources(db: Session, category: Optional[str] = None) -> List[SupportResource]:
        query = db.query(SupportResource)
        if category and category.upper() != "ALL":
            query = query.filter(SupportResource.category == category.upper())
        return query.order_by(SupportResource.created_at.desc()).all()

    @staticmethod
    def create_support_resource(db: Session, data: SupportResourceCreate) -> SupportResource:
        res = SupportResource(
            title=data.title,
            category=data.category,
            description=data.description,
            contact_number=data.contact_number,
            address=data.address,
            link_url=data.link_url,
            is_verified=data.is_verified
        )
        db.add(res)
        db.commit()
        db.refresh(res)
        return res

    @staticmethod
    def delete_support_resource(db: Session, resource_id: int) -> bool:
        res = db.query(SupportResource).filter(SupportResource.id == resource_id).first()
        if not res:
            return False
        db.delete(res)
        db.commit()
        return True

    @staticmethod
    def get_partner_offers(db: Session) -> List[PartnerOffer]:
        return db.query(PartnerOffer).filter(PartnerOffer.is_active == True).all()

    @staticmethod
    def create_partner_offer(db: Session, data: PartnerOfferCreate) -> PartnerOffer:
        offer = PartnerOffer(
            title=data.title,
            partner_name=data.partner_name,
            facility_id=data.facility_id,
            offer_type=data.offer_type,
            description=data.description,
            terms=data.terms,
            valid_until=data.valid_until,
            is_active=data.is_active
        )
        db.add(offer)
        db.commit()
        db.refresh(offer)
        return offer
