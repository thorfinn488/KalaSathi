from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from app.repositories.product_repository import ProductRepository
from app.repositories.artisan_repository import ArtisanRepository
from app.repositories.opportunity_repository import OpportunityRepository
from app.repositories.buyer_repository import BuyerRepository
from app.models.user import User, UserRole
from app.models.product import ProductStatus
from app.models.market_opportunity import OpportunityStatus
from app.models.ai_insight import AIInsight
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    CatalogueStatusCounts,
    DashboardInsightsResponse,
    DashboardActivityMonth,
    DashboardCategoryTrend,
    DashboardTrends,
    InsightItem,
)
from app.services.product_service import ProductService


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        self.artisan_repo = ArtisanRepository(db)
        self.opp_repo = OpportunityRepository(db)
        self.buyer_repo = BuyerRepository(db)
        self.product_service = ProductService(db)

    def get_artisan_dashboard(self, user: User) -> DashboardSummaryResponse:
        artisan = self.artisan_repo.get_by_user_id(user.id)
        artisan_id = artisan.id if artisan else None

        products, total = self.product_repo.list_products(artisan_id=artisan_id, page=1, page_size=5)
        
        status_counts = CatalogueStatusCounts(ready=0, processing=0, draft=0)
        activity_counts = {}
        category_counts = {}
        prices = []
        open_match_scores = []
        if artisan_id:
            all_artisan_products, _ = self.product_repo.list_products(artisan_id=artisan_id, page=1, page_size=1000)
            for p in all_artisan_products:
                if p.status == ProductStatus.READY or p.status == ProductStatus.PUBLISHED:
                    status_counts.ready += 1
                elif p.status == ProductStatus.PROCESSING:
                    status_counts.processing += 1
                elif p.status == ProductStatus.DRAFT:
                    status_counts.draft += 1

                if p.created_at:
                    month_key = p.created_at.strftime("%Y-%m")
                    activity_counts[month_key] = activity_counts.get(month_key, 0) + 1

                category = p.catalogue.category if p.catalogue else None
                if category:
                    category_data = category_counts.setdefault(category, {"products": 0, "prices": []})
                    category_data["products"] += 1
                    if p.pricing:
                        category_data["prices"].append(p.pricing.suggested_price)

                if p.pricing:
                    prices.append(p.pricing.suggested_price)

                open_match_scores.extend(
                    opportunity.match_score
                    for opportunity in p.opportunities
                    if opportunity.status == OpportunityStatus.OPEN
                )

        now = datetime.now(timezone.utc)
        month_keys = []
        for offset in reversed(range(6)):
            month_index = now.year * 12 + now.month - 1 - offset
            year, month = divmod(month_index, 12)
            month_keys.append(f"{year}-{month + 1:02d}")

        monthly_activity = [
            DashboardActivityMonth(
                month=datetime.strptime(month_key, "%Y-%m").strftime("%b"),
                count=activity_counts.get(month_key, 0),
            )
            for month_key in month_keys
        ]
        categories = [
            DashboardCategoryTrend(
                name=name,
                products=data["products"],
                average_suggested_price=(sum(data["prices"]) / len(data["prices"]) if data["prices"] else None),
            )
            for name, data in category_counts.items()
        ]
        categories.sort(key=lambda category: (-category.products, category.name.lower()))
        trends = DashboardTrends(
            monthly_activity=monthly_activity,
            categories=categories,
            average_suggested_price=(sum(prices) / len(prices) if prices else None),
            priced_products=len(prices),
            open_opportunities=len(open_match_scores),
            average_match_score=(sum(open_match_scores) / len(open_match_scores) if open_match_scores else None),
        )

        recent_items = [self.product_service.get_product_detail(p.id, user) for p in products]

        return DashboardSummaryResponse(
            total_products=total,
            catalogue_status=status_counts,
            recent_products=recent_items,
            trends=trends,
        )

    def get_artisan_insights(self, user: User) -> DashboardInsightsResponse:
        artisan = self.artisan_repo.get_by_user_id(user.id)
        items = []

        if artisan:
            insights_rows = self.db.query(AIInsight).filter(AIInsight.artisan_id == artisan.id).all()
            for row in insights_rows:
                items.append(InsightItem(type=row.type, message=row.message))

        return DashboardInsightsResponse(insights=items)
