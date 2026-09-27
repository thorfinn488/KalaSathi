from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductDetailResponse


class CatalogueStatusCounts(BaseModel):
    ready: int = 0
    processing: int = 0
    draft: int = 0


class DashboardActivityMonth(BaseModel):
    month: str
    count: int


class DashboardCategoryTrend(BaseModel):
    name: str
    products: int
    average_suggested_price: Optional[float] = None


class DashboardTrends(BaseModel):
    monthly_activity: List[DashboardActivityMonth]
    categories: List[DashboardCategoryTrend]
    average_suggested_price: Optional[float] = None
    priced_products: int = 0
    open_opportunities: int = 0
    average_match_score: Optional[float] = None


class DashboardSummaryResponse(BaseModel):
    total_products: int
    catalogue_status: CatalogueStatusCounts
    recent_products: List[ProductDetailResponse]
    trends: DashboardTrends


class InsightItem(BaseModel):
    type: str
    message: str


class DashboardInsightsResponse(BaseModel):
    insights: List[InsightItem]
