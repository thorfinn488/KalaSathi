from fastapi import APIRouter

router = APIRouter()

@router.post("/predict", tags=["AI"])
async def predict(payload: dict):
    """Placeholder AI prediction endpoint.
    Currently returns a static mock response. Replace with real model call.
    """
    return {
        "model": "mock-gpt-oss-120b",
        "input": payload,
        "output": "This is a mock prediction based on the provided input."
    }
