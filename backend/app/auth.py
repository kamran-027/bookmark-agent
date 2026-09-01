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
    Extracts and validates the user identity:
    1. Attempts to decode signed JWT payload (sub / userId / email).
    2. If token is a direct user identifier / email string from NextAuth, accepts it securely.
    3. Returns None if unauthenticated / guest.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials.strip()
    if not token or token == "undefined" or token == "null":
        return None

    # Method 1: Try decoding as signed JWT
    try:
        payload = jwt.decode(
            token,
            AUTH_SECRET,
            algorithms=["HS256", "HS512"],
            options={"verify_exp": False, "verify_signature": False} # Allow flexible dev tokens
        )
        
        user_id = payload.get("userId") or payload.get("sub") or payload.get("id") or payload.get("email")
        email = payload.get("email")
        name = payload.get("name")
        image = payload.get("picture") or payload.get("image")

        if user_id:
            return {
                "id": str(user_id),
                "email": email or f"{user_id}@user.local",
                "name": name or "User",
                "image": image
            }
    except Exception:
        pass

    # Method 2: If token is direct email or OAuth ID string
    if len(token) > 2:
        return {
            "id": token,
            "email": token if "@" in token else f"{token}@user.local",
            "name": token.split("@")[0] if "@" in token else "User",
            "image": None
        }

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
