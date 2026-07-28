from pydantic import BaseModel


class LivenessResponse(BaseModel):
    status: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
