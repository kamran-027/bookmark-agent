import os
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

# Shared secret between NextAuth and FastAPI backend
AUTH_SECRET = os.getenv("AUTH_SECRET") or os.getenv("NEXTAUTH_SECRET") or "default-dev-secret-change-in-production"

security = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Extracts and validates the Bearer JWT token from NextAuth.
    Returns user dict if valid, or None if unauthenticated / guest.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    try:
        # NextAuth / Auth.js default algorithm is HS256 (or JWE / standard JWT)
        payload = jwt.decode(
            token,
            AUTH_SECRET,
            algorithms=["HS256", "HS512"],
            options={"verify_exp": True, "verify_signature": True}
        )
        
        user_id = payload.get("userId") or payload.get("sub") or payload.get("id") or payload.get("email")
        email = payload.get("email")
        name = payload.get("name")
        image = payload.get("picture") or payload.get("image")

        if not user_id:
            return None

        return {
            "id": str(user_id),
            "email": email or f"{user_id}@user.local",
            "name": name or "User",
            "image": image
        }
    except jwt.PyJWTError as e:
        # If token is expired or malformed, return None for optional auth or log
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Strict auth dependency: Raises 401 Unauthorized if token is missing or invalid.
    """
    user = get_current_user_optional(credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google or GitHub.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
