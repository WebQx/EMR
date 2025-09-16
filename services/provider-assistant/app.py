from fastapi import FastAPI, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Provider Assistant Service", version="0.1.0", description="Scaffold for provider clinical assistance endpoints.")

class SummaryRequest(BaseModel):
    patient_id: str
    context: Optional[str] = None
    language: Optional[str] = "en"

class PlanRequest(BaseModel):
    patient_id: str
    problem_list: list[str] = []
    notes: Optional[str] = None

class TriageRequest(BaseModel):
    complaint: str
    vitals: Optional[dict] = None

class AssistResponse(BaseModel):
    result: str
    model: str = "mock-clinical-assistant"

from services.shared.jwt_rs256 import JWTVerifier, VerifierSettings
from services.shared.audit import get_audit_logger
from services.shared import rbac
import os

_verifier = None
def get_verifier():
    global _verifier
    if _verifier is None:
        # Prefer new short alias path /auth/.well-known/jwks.json; fallback keeps backward compatibility
        settings = VerifierSettings(
            jwks_url=os.getenv("JWT_JWKS_URL", os.getenv("JWT_JWKS_FALLBACK", "http://localhost:8000/auth/.well-known/jwks.json")),
            issuer=os.getenv("JWT_ISSUER", "webqx.healthcare"),
            audience=os.getenv("JWT_AUDIENCE", "webqx.emr"),
        )
        _verifier = JWTVerifier(settings)
    return _verifier

async def verify_auth(authorization: Optional[str] = Header(None)):
    try:
        claims = await get_verifier().verify(authorization)
        # Minimal RBAC placeholder: ensure role claim exists
        if 'role' not in claims:
            raise HTTPException(status_code=403, detail="Missing role claim")
        return claims
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/v1/assist/summary", response_model=AssistResponse)
async def summarize(req: SummaryRequest, claims=Depends(verify_auth)):
    # Mock summarization logic
    snippet = f"Patient {req.patient_id}: concise chart summary placeholder." if not req.context else req.context[:140]
    rbac.check("assist.summary", claims)
    get_audit_logger().log("assist.summary", actor=claims.get("sub"), resource=req.patient_id)
    return AssistResponse(result=snippet)

@app.post("/v1/assist/plan", response_model=AssistResponse)
async def plan(req: PlanRequest, claims=Depends(verify_auth)):
    pl = ", ".join(req.problem_list) if req.problem_list else "no active problems listed"
    rbac.check("assist.plan", claims)
    get_audit_logger().log("assist.plan", actor=claims.get("sub"), resource=req.patient_id, details={"problems": req.problem_list})
    return AssistResponse(result=f"Assessment & Plan draft for {req.patient_id}: {pl}.")

@app.post("/v1/assist/triage", response_model=AssistResponse)
async def triage(req: TriageRequest, claims=Depends(verify_auth)):
    # Extremely naive placeholder
    urgency = "urgent" if any(k in req.complaint.lower() for k in ["chest", "stroke", "severe"]) else "routine"
    rbac.check("assist.triage", claims)
    get_audit_logger().log("assist.triage", actor=claims.get("sub"), details={"complaint": req.complaint, "urgency": urgency})
    return AssistResponse(result=f"Triage classification: {urgency}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8101)
