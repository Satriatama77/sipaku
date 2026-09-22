from fastapi import Request
from starlette.responses import JSONResponse
from jose import jwt, JWTError
from app.config import SECRET_KEY, ALGORITHM

# Role yang diizinkan per prefix endpoint
ROLE_PERMISSIONS = {
    "/api/admin":   ["admin"],
    "/api/katalog": ["penjual", "admin"],
    "/api/laporan": ["pembeli", "penjual", "admin"],
    "/api/nlp":     ["admin", "penjual"],
}

async def rbac_middleware(request: Request, call_next):
    """
    Middleware RBAC: verifikasi JWT dan cek izin role per endpoint.
    Endpoint publik (/api/auth, /api/harga/ssh, /) tidak butuh token.
    """
    # Request OPTIONS (CORS preflight) selalu lolos tanpa cek token
    if request.method == "OPTIONS":
        return await call_next(request)

    # Dapatkan path dari request
    path = request.url.path
    
    # Endpoint publik tidak memerlukan token JWT:
    # - / dan dokumentasi API
    # - /api/auth (login & logout)
    # - /api/harga (standar satuan harga SSH)
    # - GET /api/katalog (semua katalog & harga pasar toko dapat dilihat publik/pembeli)
    # - GET & POST /api/laporan (warga/pembeli bebas melapor dan melihat laporan tanpa login)
    # - GET /api/toko
    is_public = (
        path == "/"
        or any(path.startswith(p) for p in ["/api/auth", "/api/harga", "/docs", "/openapi.json", "/redoc"])
        or (request.method == "GET" and path.startswith("/api/katalog"))
        or (request.method == "GET" and path.startswith("/api/toko"))
        or (request.method in ["GET", "POST"] and path.startswith("/api/laporan"))
    )

    if is_public:
        return await call_next(request)

    # Ambil token dari header Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Token autentikasi diperlukan"})

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role = payload.get("role")
        request.state.user_id = payload.get("sub")
        request.state.role = role
    except JWTError:
        return JSONResponse(status_code=401, content={"detail": "Token tidak valid atau sudah kadaluarsa"})

    # Cek izin role
    for prefix, allowed_roles in ROLE_PERMISSIONS.items():
        if path.startswith(prefix) and role not in allowed_roles:
            return JSONResponse(
                status_code=403,
                content={"detail": f"Role '{role}' tidak memiliki akses ke endpoint ini"}
            )

    return await call_next(request)
