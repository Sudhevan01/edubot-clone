"""Cost and token tracker endpoint router with Swagger / OpenAPI documentation."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.api.schemas import CostTrackerMetricsResponse
from app.config import Settings, get_settings
from app.guards.cost_tracker import CostTracker, default_cost_tracker

router = APIRouter(tags=["Cost & Token Tracker"])


def get_cost_tracker() -> CostTracker:
    """Dependency provider for CostTracker."""
    return default_cost_tracker


@router.get(
    "/api/cost",
    response_model=CostTrackerMetricsResponse,
    summary="Live Cost & Token Tracker",
    description=(
        "Returns real-time live metrics on tokens consumed (total, input, output), "
        "daily expenditure vs budget cap, remaining pending budget, and session-specific token usage. "
        "Click 'Execute' to fetch the latest live numbers."
    ),
)
async def get_cost_status(
    session_id: Optional[str] = Query(
        default=None,
        description="Optional: Leave blank to automatically see the current/latest session, or enter a specific session UUID.",
    ),
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    settings: Settings = Depends(get_settings),
) -> CostTrackerMetricsResponse:
    """Return live cost, token counts, and session usage stats."""
    metrics = await cost_tracker.get_metrics(session_id=session_id, settings=settings)
    return CostTrackerMetricsResponse(**metrics)
