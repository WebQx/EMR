"""RBAC policy enforcement.

Policies format (JSON):
{
  "action.name": {"roles": ["provider"], "specialties_any": ["psychiatry"]}
}
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, Any, Iterable

_POLICIES: Dict[str, Any] | None = None


def load_policies(path: str = "services/shared/rbac_policies.json") -> Dict[str, Any]:
    global _POLICIES
    if _POLICIES is None:
        p = Path(path)
        _POLICIES = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    return _POLICIES


class RBACError(Exception):
    pass


def check(action: str, claims: Dict[str, Any], *, policy_path: str = "services/shared/rbac_policies.json"):
    policies = load_policies(policy_path)
    rule = policies.get(action)
    if not rule:
        raise RBACError(f"No policy for action {action}")
    role = claims.get("role")
    if role not in rule.get("roles", []):
        raise RBACError(f"Role '{role}' not permitted for {action}")
    specialties_req: Iterable[str] = rule.get("specialties_any", [])
    if specialties_req:
        user_specs = set(claims.get("specialties", []))
        if user_specs.isdisjoint(specialties_req):
            raise RBACError("Required specialty missing")
    return True


__all__ = ["check", "RBACError", "load_policies"]
