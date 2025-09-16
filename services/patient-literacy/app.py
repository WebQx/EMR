from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Patient Literacy Service", version="0.1.0")

class ExplainRequest(BaseModel):
    term: str
    context: Optional[str] = None
    language: str = "en"
    reading_level: Optional[str] = "8th"

class ChecklistRequest(BaseModel):
    appointment_type: str
    language: str = "en"

class MedicationRequest(BaseModel):
    medication_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    language: str = "en"

class LiteracyResponse(BaseModel):
    result: str
    model: str = "mock-literacy-assistant"

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
        # Require patient or caregiver related role
        role = claims.get('role')
        if role not in {'patient','caregiver','provider'}:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return claims
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get('/health')
async def health():
    return {"status": "ok"}

@app.post('/v1/literacy/explain', response_model=LiteracyResponse)
async def explain(req: ExplainRequest, claims=Depends(verify_auth)):
    rbac.check("literacy.explain", claims)
    get_audit_logger().log("literacy.explain", actor=claims.get("sub"), details={"term": req.term})
    return LiteracyResponse(result=f"Plain explanation placeholder for term '{req.term}'.")

@app.post('/v1/literacy/checklist', response_model=LiteracyResponse)
async def checklist(req: ChecklistRequest, claims=Depends(verify_auth)):
    rbac.check("literacy.checklist", claims)
    get_audit_logger().log("literacy.checklist", actor=claims.get("sub"), details={"type": req.appointment_type})
    return LiteracyResponse(result=f"Checklist for {req.appointment_type}: arrive early, bring ID, list medications.")

@app.post('/v1/literacy/medication', response_model=LiteracyResponse)
async def medication(req: MedicationRequest, claims=Depends(verify_auth)):
    rbac.check("literacy.medication", claims)
    get_audit_logger().log("literacy.medication", actor=claims.get("sub"), resource=req.medication_name)
    return LiteracyResponse(result=f"Use {req.medication_name} exactly as directed. Monitor for side effects.")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8102)
