from fastapi import Request, HTTPException
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM

# Role yang diizinkan per prefix endpoint
ROLE_PERMISSIONS = {
    "/api/admin": ["admin"],
    "/api/katalog": ["penjual", "admin"],
    "/api/laporan": ["pembeli", "penjual", "admin"],
    "/api/nlp":     ["penjual", "admin"],
}

async def rbac_middleware(request: Request, call_next):
    """
    Middleware RBAC: verifikasi JWT dan cek izin role per endpoint.
    Endpoint publik (/api/auth, /api/harga/ssh, /) tidak butuh token.
    """
    path = request.url.path
    PUBLIC_PATHS = ["/", "/api/auth/login", "/api/harga/ssh", "/docs", "/openapi.json", "/redoc"]

    if any(path.startswith(p) for p in PUBLIC_PATHS):
        return await call_next(request)

    # Ambil token dari header Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token autentikasi diperlukan")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        request.state.user_id = payload.get("sub")
        request.state.role = role
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau sudah kadaluarsa")

    # Cek izin role
    for prefix, allowed_roles in ROLE_PERMISSIONS.items():
        if path.startswith(prefix) and role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role}' tidak memiliki akses ke endpoint ini"
            )

    return await call_next(request)
