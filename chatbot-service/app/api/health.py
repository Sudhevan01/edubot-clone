"""Health check endpoint router with OpenAPI documentation."""

from fastapi import APIRouter
from app.api.schemas import HealthResponse

router = APIRouter(tags=["Health"])


health_openapi_responses = {
    200: {
        "model": HealthResponse,
        "description": "Service is healthy and ready.",
        "content": {
            "application/json": {
                "example": {
                    "status": "ok"
                }
            }
        }
    }
}


@router.get(
    "/api/health",
    response_model=HealthResponse,
    responses=health_openapi_responses,
    summary="Health Check",
    description="Returns service status to verify the backend is online.",
)
async def health_check() -> HealthResponse:
    """Return health status of the API service."""
    return HealthResponse(status="ok")
